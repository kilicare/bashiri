"""
AI Pick Generation and Settlement Tasks

Celery tasks for:
1. Generating AI picks from predictions with tier qualification
2. Settling AI picks when matches finish
3. Updating AI Pick status based on match status
"""

import uuid
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from .models import AIPick, Match
from .ai_pick_config import qualify_ai_pick, get_market_label, get_selection_label, ELITE_MARKETS, FREE_MARKETS
from .settlement_engine import settle_ai_pick
from .ml.poisson_model import predict_fixture


@shared_task
def generate_ai_picks(feed_type="STANDARD"):
    """
    Generate AI picks from upcoming matches using qualification engine.
    Also creates corresponding feed cards for display.

    Args:
        feed_type: "STANDARD" or "PREMIUM"
    """
    from django.conf import settings
    from feed.models import Card

    # Get upcoming matches (today + 2 days)
    today = timezone.localdate()
    two_days_ahead = today + timedelta(days=2)

    matches = Match.objects.filter(
        kickoff_at__date__gte=today,
        kickoff_at__date__lte=two_days_ahead,
        status="SCHEDULED"
    ).select_related('league', 'home_team', 'away_team')

    picks_created = 0
    picks_skipped = 0

    for match in matches:
        # Skip if pick already exists for this match
        existing_pick = AIPick.objects.filter(match=match, feed=feed_type).first()
        if existing_pick:
            picks_skipped += 1
            continue

        try:
            # Get prediction from Poisson model
            prediction = predict_fixture(
                match.league.poisson_key,
                match.home_team.name,
                match.away_team.name,
            )

            # Evaluate all available markets for qualification
            best_pick = None
            best_rec_score = 0

            # Map prediction data to market keys
            market_candidates = []

            # 1X2 markets
            if prediction.get('match_result'):
                mr = prediction['match_result']
                market_candidates.append({
                    'market': '1x2_home',
                    'selection': 'Home',
                    'probability': mr.get('home_win', 0),
                })
                market_candidates.append({
                    'market': '1x2_draw',
                    'selection': 'Draw',
                    'probability': mr.get('draw', 0),
                })
                market_candidates.append({
                    'market': '1x2_away',
                    'selection': 'Away',
                    'probability': mr.get('away_win', 0),
                })

            # BTTS markets
            if prediction.get('btts'):
                btts = prediction['btts']
                market_candidates.append({
                    'market': 'btts_yes',
                    'selection': 'Yes',
                    'probability': btts.get('btts_yes', 0),
                })
                market_candidates.append({
                    'market': 'btts_no',
                    'selection': 'No',
                    'probability': btts.get('btts_no', 0),
                })

            # Double Chance markets
            if prediction.get('double_chance'):
                dc = prediction['double_chance']
                market_candidates.append({
                    'market': 'dc_1x',
                    'selection': '1X',
                    'probability': dc.get('1x', 0),
                })
                market_candidates.append({
                    'market': 'dc_x2',
                    'selection': 'X2',
                    'probability': dc.get('x2', 0),
                })
                market_candidates.append({
                    'market': 'dc_12',
                    'selection': '12',
                    'probability': dc.get('12', 0),
                })

            # Over/Under markets
            if prediction.get('over_under'):
                ou = prediction['over_under']
                if ou.get('over_1_5'):
                    market_candidates.append({
                        'market': 'over_1_5',
                        'selection': 'Over',
                        'probability': ou.get('over_1_5', 0),
                    })
                if ou.get('over_2_5'):
                    market_candidates.append({
                        'market': 'over_2_5',
                        'selection': 'Over',
                        'probability': ou.get('over_2_5', 0),
                    })

            # Team goals markets
            if prediction.get('home_goals'):
                hg = prediction['home_goals']
                if hg.get('over_0_5'):
                    market_candidates.append({
                        'market': 'home_over_0_5',
                        'selection': 'Over',
                        'probability': hg.get('over_0_5', 0),
                    })
                if hg.get('over_1_5'):
                    market_candidates.append({
                        'market': 'home_over_1_5',
                        'selection': 'Over',
                        'probability': hg.get('over_1_5', 0),
                    })

            if prediction.get('away_goals'):
                ag = prediction['away_goals']
                if ag.get('over_0_5'):
                    market_candidates.append({
                        'market': 'away_over_0_5',
                        'selection': 'Over',
                        'probability': ag.get('over_0_5', 0),
                    })
                if ag.get('over_1_5'):
                    market_candidates.append({
                        'market': 'away_over_1_5',
                        'selection': 'Over',
                        'probability': ag.get('over_1_5', 0),
                    })

            # Find best qualified pick
            for candidate in market_candidates:
                tier = qualify_ai_pick(
                    candidate['market'],
                    candidate['probability'],
                    feed_type
                )

                if tier:
                    # Calculate recommendation score (tier * probability)
                    tier_score = {'ELITE': 3, 'STRONG': 2, 'MINIMUM': 1}.get(tier, 0)
                    rec_score = tier_score * candidate['probability']

                    if rec_score > best_rec_score:
                        best_rec_score = rec_score
                        best_pick = {
                            **candidate,
                            'tier': tier,
                        }

            # Create AI Pick if qualified
            if best_pick:
                with transaction.atomic():
                    pick = AIPick.objects.create(
                        pick_id=uuid.uuid4(),
                        match=match,
                        home_team=match.home_team.name,
                        away_team=match.away_team.name,
                        league=match.league.name,
                        kickoff_at=match.kickoff_at,
                        market=best_pick['market'],
                        selection=best_pick['selection'],
                        probability=best_pick['probability'] / 100,  # Store as decimal (0.827)
                        probability_percent=round(best_pick['probability'], 1),  # Store as percentage (82.7)
                        tier=best_pick['tier'],
                        feed=feed_type,
                        status='PENDING',
                        model_version=prediction.get('model_version', 'unknown'),
                        threshold_config_version='v1',
                        market_config_version='v1',
                        published_at=timezone.now(),
                    )
                    picks_created += 1

                    # Create corresponding feed card for display
                    card_type = "BIG_MATCH" if match.is_big_match else "AI_PICK"
                    Card.objects.create(
                        type=card_type,
                        match_id=match.id,
                        data={
                            'match': {
                                'id': match.id,
                                'home_team': match.home_team.name,
                                'away_team': match.away_team.name,
                                'home_team_crest_url': match.home_team.crest_url,
                                'away_team_crest_url': match.away_team.crest_url,
                                'kickoff_at': match.kickoff_at.isoformat(),
                                'league': match.league.name,
                            },
                            'ai_pick': {
                                'option_key': best_pick['selection'].lower(),
                                'market_label': get_market_label(best_pick['market']),
                                'confidence': round(best_pick['probability'] * 100, 1),
                                'tier': best_pick['tier'],
                                'status': 'PENDING',
                                'pick_id': str(pick.pick_id),
                            }
                        }
                    )
            else:
                picks_skipped += 1

        except Exception as e:
            print(f"Error generating AI pick for match {match.id}: {e}")
            picks_skipped += 1

    return {
        'feed_type': feed_type,
        'picks_created': picks_created,
        'picks_skipped': picks_skipped,
    }


@shared_task
def update_ai_pick_status():
    """
    Update AI Pick status based on match status.
    PENDING -> LIVE when match starts
    LIVE -> settlement when match finishes
    """
    from django.db import transaction

    # Update PENDING to LIVE for matches that have started
    AIPick.objects.filter(
        status='PENDING',
        match__status='LIVE'
    ).update(status='LIVE')

    # Settle LIVE picks for finished matches
    live_picks = AIPick.objects.filter(
        status='LIVE',
        match__status='FINISHED'
    ).select_related('match')

    settled_count = 0
    for pick in live_picks:
        match = pick.match

        if match.home_score is None or match.away_score is None:
            continue

        with transaction.atomic():
            # Settlement is idempotent - skip if already settled
            if pick.status in ['WON', 'LOST', 'PUSH', 'VOID']:
                continue

            # Run settlement engine
            settlement = settle_ai_pick(
                pick.market,
                pick.selection,
                match.home_score,
                match.away_score
            )

            # Update pick with result
            pick.status = settlement.status
            pick.actual_home_score = match.home_score
            pick.actual_away_score = match.away_score
            pick.result = settlement.status
            pick.settled_at = timezone.now()
            pick.save(update_fields=['status', 'actual_home_score', 'actual_away_score', 'result', 'settled_at'])

            settled_count += 1

    return {
        'settled_count': settled_count,
    }


@shared_task
def generate_daily_ai_picks():
    """
    Scheduled task to generate AI picks for both feeds.
    Run this daily (e.g., at 00:00 UTC).
    """
    standard_result = generate_ai_picks(feed_type="STANDARD")
    premium_result = generate_ai_picks(feed_type="PREMIUM")

    return {
        'standard': standard_result,
        'premium': premium_result,
    }


@shared_task
def update_pick_status_periodic():
    """
    Periodic task to update AI Pick status.
    Run this every 5-10 minutes.
    """
    return update_ai_pick_status()
