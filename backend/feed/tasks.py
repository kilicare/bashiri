"""feed/tasks.py — Celery: recaps, stats, polls, live updates, weekly report."""
import logging
from datetime import timedelta

from celery import shared_task
from django.db.models import Q
from django.utils import timezone

from .models import Card

logger = logging.getLogger(__name__)


@shared_task
def generate_result_recaps():
    from predictions.models import Match, AIPerformance
    from predictions.services import is_prediction_correct

    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    finished_recent = Match.objects.filter(
        status="FINISHED",
        kickoff_at__date__gte=yesterday,
        kickoff_at__date__lte=today,
        home_score__isnull=False, away_score__isnull=False,
    ).select_related("home_team", "away_team", "league")

    created_count = 0
    total_predictions = 0
    correct_predictions = 0
    high_conf_predictions = 0
    high_conf_correct = 0

    for match in finished_recent:
        # Deactivate LIVE_MATCH card for this match if it exists and is still active
        Card.objects.filter(
            type="LIVE_MATCH", match_id=match.id, is_active=True
        ).update(is_active=False)

        ai_pick_card = Card.objects.filter(
            type__in=["AI_PICK", "BIG_MATCH"], match_id=match.id
        ).first()
        if not ai_pick_card:
            continue
        if Card.objects.filter(type="RESULT_RECAP", match_id=match.id).exists():
            continue

        ai_pick = ai_pick_card.data.get("ai_pick", {})
        # MUHIMU: sasa tunatumia market_key/option_key HALISI kutoka
        # data ya card (si "1X2" iliyofungwa) — ai_pick inaweza kuwa
        # soko lolote kati ya 3 za bure (1X2, O/U 2.5, BTTS).
        market_key = ai_pick.get("market_key", "1X2")
        option_key = ai_pick.get("option_key", "")
        confidence = ai_pick.get("confidence", 0)
        was_correct = is_prediction_correct(market_key, option_key, match.home_score, match.away_score)

        Card.objects.create(
            type="RESULT_RECAP", match_id=match.id,
            data={
                "match": {
                    "home_team": match.home_team.name, "away_team": match.away_team.name,
                    "home_score": match.home_score, "away_score": match.away_score,
                },
                "ai_predicted": ai_pick.get("option_label", ai_pick.get("selection")),
                "ai_market": ai_pick.get("market_label"),
                "ai_confidence": confidence,
                "was_correct": was_correct,
            },
        )
        created_count += 1

        # Track AI performance
        total_predictions += 1
        if was_correct:
            correct_predictions += 1
        if confidence >= 70:
            high_conf_predictions += 1
            if was_correct:
                high_conf_correct += 1

    # Update or create AIPerformance record for today
    if total_predictions > 0:
        performance, created = AIPerformance.objects.get_or_create(
            date=today,
            defaults={
                "total_predictions": total_predictions,
                "correct_predictions": correct_predictions,
                "high_confidence_predictions": high_conf_predictions,
                "high_confidence_correct": high_conf_correct,
            }
        )
        if not created:
            performance.total_predictions += total_predictions
            performance.correct_predictions += correct_predictions
            performance.high_confidence_predictions += high_conf_predictions
            performance.high_confidence_correct += high_conf_correct
            performance.save()
        performance.calculate_accuracy()

    logger.info(f"generate_result_recaps: {created_count} recaps")
    return f"Result recaps: {created_count}"


@shared_task
def generate_stat_cards():
    from predictions.models import Match
    from predictions.services import team_form

    upcoming = Match.objects.filter(
        status="SCHEDULED", kickoff_at__gte=timezone.now(),
        kickoff_at__lte=timezone.now() + timedelta(hours=48),
    ).select_related("home_team", "away_team", "league")

    created_count = 0
    for match in upcoming:
        if Card.objects.filter(type="STAT", match_id=match.id).exists():
            continue
        Card.objects.create(
            type="STAT", match_id=match.id,
            data={
                "match": {
                    "home_team": match.home_team.name, "away_team": match.away_team.name,
                    "league": match.league.name,
                },
                "home_form": team_form(match.home_team_id, exclude_match_id=match.id),
                "away_form": team_form(match.away_team_id, exclude_match_id=match.id),
            },
        )
        created_count += 1

    logger.info(f"generate_stat_cards: {created_count} cards")
    return f"Stat cards: {created_count}"


@shared_task
def generate_poll_cards():
    from predictions.models import Match

    upcoming_big = Match.objects.filter(
        status="SCHEDULED", is_big_match=True,
        kickoff_at__gte=timezone.now(), kickoff_at__lte=timezone.now() + timedelta(hours=24),
    ).select_related("home_team", "away_team")

    created_count = 0
    for match in upcoming_big:
        if Card.objects.filter(type="POLL", match_id=match.id).exists():
            continue
        Card.objects.create(
            type="POLL", match_id=match.id,
            data={
                "question": f"Nani atashinda: {match.home_team.name} vs {match.away_team.name}?",
                "options": [match.home_team.name, "Sare", match.away_team.name],
                "tallies": {}, "vote_count": 0, "engagement_threshold": 50,
            },
        )
        created_count += 1

    logger.info(f"generate_poll_cards: {created_count} cards")
    return f"Poll cards: {created_count}"


@shared_task
def update_live_match_cards():
    from django.core.cache import cache
    from predictions.models import Match

    live_matches = Match.objects.filter(status="LIVE").select_related("home_team", "away_team", "league")
    updated_count = 0
    created_count = 0
    data_changed = False
    for match in live_matches:
        new_data = {
            "match": {
                "home_team": match.home_team.name, "away_team": match.away_team.name,
                "league": match.league.name,
                "score": {"home": match.home_score or 0, "away": match.away_score or 0},
            }
        }
        card, created = Card.objects.get_or_create(
            type="LIVE_MATCH", 
            match_id=match.id, 
            defaults={"data": new_data, "is_active": True}
        )
        if created:
            created_count += 1
            data_changed = True
            logger.info(f"Created LIVE_MATCH card for match #{match.id}: {match.home_team.name} vs {match.away_team.name}")
        # Check if data actually changed
        elif card.data != new_data:
            card.data = new_data
            card.save(update_fields=["data"])
            updated_count += 1
            data_changed = True
        # Ensure card is active
        elif not card.is_active:
            card.is_active = True
            card.save(update_fields=["is_active"])
            data_changed = True
            logger.info(f"Activated LIVE_MATCH card for match #{match.id}")

    # Invalidate specific caches if live card data changed
    if data_changed:
        cache.delete("live_matches")
        # Invalidate feed cache (only when live data changes)
        cache.delete("feed_list")
        logger.info("Cache invalidated: live_matches and feed_list")

    return f"Live cards: {created_count} created, {updated_count} updated"


@shared_task
def generate_weekly_report():
    week_ago = timezone.now() - timedelta(days=7)
    recaps = Card.objects.filter(type="RESULT_RECAP", created_at__gte=week_ago)
    total = recaps.count()
    if total == 0:
        return "Hakuna result recaps za wiki hii."

    correct = sum(1 for r in recaps if r.data.get("was_correct"))
    accuracy = round((correct / total) * 100, 1)

    Card.objects.create(
        type="AI_WEEKLY_REPORT",
        data={
            "week_ending": timezone.localdate().isoformat(),
            "total_predictions": total, "correct_predictions": correct,
            "accuracy_percentage": accuracy,
        },
    )
    return f"Weekly report: {correct}/{total} ({accuracy}%)"


@shared_task
def generate_did_you_know_cards():
    """Kila siku, tengeneza Did You Know cards kwa timu zenye facts za kuvutia."""
    import random

    from predictions.models import Team

    from .insights import generate_facts_for_team

    teams = list(Team.objects.all())
    random.shuffle(teams)

    created_count = 0
    for team in teams[:30]:  # angalia timu 30 tu kwa siku, epuka Celery kuchukua muda mrefu
        facts = generate_facts_for_team(team)
        if not facts:
            continue

        fact_text = random.choice(facts)

        # Epuka fact ile ile ndani ya wiki moja kwa timu hiyo hiyo
        week_ago = timezone.now() - timedelta(days=7)
        duplicate = Card.objects.filter(
            type="DID_YOU_KNOW", data__team_id=team.id, data__fact=fact_text, created_at__gte=week_ago
        ).exists()
        if duplicate:
            continue

        Card.objects.create(
            type="DID_YOU_KNOW",
            data={"team_id": team.id, "team_name": team.name, "fact": fact_text, "league": team.league.name},
        )
        created_count += 1

        if created_count >= 8:  # tosha kwa siku moja
            break

    logger.info(f"generate_did_you_know_cards: {created_count} cards")
    return f"Did You Know cards: {created_count}"


@shared_task
def close_expired_debates():
    from datetime import datetime

    from django.utils import timezone

    debates = Card.objects.filter(type="DEBATE", data__is_closed=False)
    closed_count = 0

    for debate in debates:
        closes_at_str = debate.data.get("closes_at")
        if not closes_at_str:
            logger.warning(f"Debate #{debate.id} haina closes_at field")
            continue

        try:
            closes_at = datetime.fromisoformat(closes_at_str)
        except (ValueError, TypeError) as e:
            logger.error(f"Debate #{debate.id}: parsing closes_at failed: {e}")
            continue

        # Make sure closes_at is timezone-aware
        if timezone.is_naive(closes_at):
            closes_at = timezone.make_aware(closes_at)

        now = timezone.now()
        if now >= closes_at:
            debate.data["voting_closed"] = True
            debate.save(update_fields=["data"])
            closed_count += 1
            logger.info(f"Debate #{debate.id} voting closed: closes_at={closes_at}, now={now}")

    logger.info(f"close_expired_debates: {closed_count} debates closed")
    return f"Debates zilizofungwa voting: {closed_count}"


@shared_task
def deactivate_finished_live_cards():
    """
    Safety-net: funga LIVE_MATCH cards ZOTE zenye is_active=True ambazo
    match yake tayari ni FINISHED, bila kujali kama generate_result_recaps
    imeshaziona leo (mfano mechi iliyomaliza jana lakini kwa sababu fulani
    haikushughulikiwa). Celery Beat: kila dakika 5.
    """
    live_cards = Card.objects.filter(type="LIVE_MATCH", is_active=True).select_related("match")
    deactivated = 0
    for card in live_cards:
        if card.match_id and card.match.status == "FINISHED":
            card.is_active = False
            card.save(update_fields=["is_active"])
            deactivated += 1
    logger.info(f"deactivate_finished_live_cards: {deactivated} cards zimefungwa")
    return f"deactivate_finished_live_cards: {deactivated} cards zimefungwa"


@shared_task
def generate_mic_winner_cards():
    """Generate MIC_WINNER cards for finished matches with mic reactions."""
    from django.core.cache import cache
    from mic.models import MicReaction
    from mic.views import FanOfMatchView
    from predictions.models import Match
    from django.conf import settings

    # Use the same 7-day window as compute_fan_of_match for consistency
    window_days = settings.BASHIRI.get("MIC_FAN_OF_MATCH_WINDOW_DAYS", 7)
    cutoff = timezone.now() - timedelta(days=window_days)
    
    # Get matches finished more than 7 days ago that have mic reactions
    finished_matches = Match.objects.filter(
        status="FINISHED",
        updated_at__lte=cutoff
    ).filter(
        mic_reactions__isnull=False
    ).distinct().select_related("home_team", "away_team", "league")

    created_count = 0
    for match in finished_matches:
        # Skip if MIC_WINNER card already exists for this match
        if Card.objects.filter(type="MIC_WINNER", match_id=match.id).exists():
            continue

        # Check if match has any active mic reactions
        reaction_count = MicReaction.objects.filter(
            match_id=match.id, is_active=True
        ).count()
        
        if reaction_count == 0:
            continue

        # Get the best video using FanOfMatchView logic
        from django.db.models import Count, Case, When, IntegerField, Sum
        
        vote_weights = {"FIRE": 3, "HUNDRED": 2}
        
        reactions = MicReaction.objects.filter(
            match_id=match.id, is_active=True
        ).select_related("user").annotate(
            vote_count=Count("votes"),
            weighted_score=Sum(
                Case(
                    *[When(votes__emoji=emoji, then=weight) for emoji, weight in vote_weights.items()],
                    default=1,
                    output_field=IntegerField()
                )
            )
        ).order_by("-weighted_score", "-vote_count", "-created_at")

        winner = reactions.first()
        
        if not winner:
            continue

        # Create MIC_WINNER card
        Card.objects.create(
            type="MIC_WINNER",
            match_id=match.id,
            data={
                "match": {
                    "id": match.id,
                    "home_team": match.home_team.name,
                    "away_team": match.away_team.name,
                    "home_score": match.home_score,
                    "away_score": match.away_score,
                    "league": match.league.name,
                },
                "winner": {
                    "id": winner.id,
                    "user": {
                        "id": winner.user.id,
                        "username": winner.user.username,
                        "avatar_url": winner.user.avatar_url,
                    },
                    "video_url": winner.video_url,
                    "thumbnail_url": winner.thumbnail_url,
                    "duration_seconds": winner.duration_seconds,
                    "mood": winner.mood,
                    "team_side": winner.team_side,
                    "vote_count": winner.vote_count,
                },
            },
        )
        created_count += 1

        # Send notification to the winner
        from notifications.models import Notification
        Notification.objects.create(
            user=winner.user,
            type="MIC_WINNER",
            title="🏆 Video Yako Imeshinda Fan of the Match!",
            body=f"Hongera! Video yako ya {match.home_team.name} vs {match.away_team.name} imepata votes zaidi na imetangazwa kuwa Fan of the Match.",
            data={
                "match_id": match.id,
                "card_id": Card.objects.filter(type="MIC_WINNER", match_id=match.id).first().id,
                "vote_count": winner.vote_count,
            },
        )

    logger.info(f"generate_mic_winner_cards: {created_count} cards")
    return f"Mic Winner cards: {created_count}"