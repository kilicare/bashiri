"""feed/tasks.py — Celery: recaps, stats, polls, live updates, weekly report."""
import logging
from datetime import timedelta

from celery import shared_task
from django.db.models import Q
from django.utils import timezone

from .models import Card, UserPrediction

logger = logging.getLogger(__name__)


@shared_task
def generate_result_recaps():
    from predictions.models import Match
    from predictions.services import is_prediction_correct

    today = timezone.localdate()
    finished_today = Match.objects.filter(
        status="FINISHED", kickoff_at__date=today,
        home_score__isnull=False, away_score__isnull=False,
    ).select_related("home_team", "away_team", "league")

    created_count = 0
    for match in finished_today:
        ai_pick_card = Card.objects.filter(type="AI_PICK", match_id=match.id).first()
        if not ai_pick_card:
            continue
        if Card.objects.filter(type="RESULT_RECAP", match_id=match.id).exists():
            continue

        ai_pick = ai_pick_card.data.get("ai_pick", {})
        selection_key = ai_pick.get("selection", "").lower().replace(" ", "_")
        was_correct = is_prediction_correct("1X2", selection_key, match.home_score, match.away_score)

        Card.objects.create(
            type="RESULT_RECAP", match_id=match.id,
            data={
                "match": {
                    "home_team": match.home_team.name, "away_team": match.away_team.name,
                    "home_score": match.home_score, "away_score": match.away_score,
                },
                "ai_predicted": ai_pick.get("selection"),
                "ai_confidence": ai_pick.get("confidence"),
                "was_correct": was_correct,
            },
        )
        created_count += 1
        _update_user_predictions_for_match(match)

    logger.info(f"generate_result_recaps: {created_count} recaps")
    return f"Result recaps: {created_count}"


def _update_user_predictions_for_match(match):
    from predictions.services import is_prediction_correct

    user_predictions = UserPrediction.objects.filter(
        match_id=match.id, is_correct__isnull=True
    ).select_related("user")

    for up in user_predictions:
        correct = is_prediction_correct(up.market, up.selection, match.home_score, match.away_score)
        up.is_correct = correct
        up.save(update_fields=["is_correct"])

        user = up.user
        user.total_predictions += 1
        if correct:
            user.correct_predictions += 1
            user.current_streak += 1
            user.best_streak = max(user.best_streak, user.current_streak)
        else:
            user.current_streak = 0
        user.save(update_fields=["total_predictions", "correct_predictions", "current_streak", "best_streak"])

        if user.current_streak > 0 and user.current_streak % 5 == 0:
            Card.objects.create(
                type="MILESTONE",
                data={
                    "user_id": user.id,
                    "username": user.username,
                    "avatar_url": user.avatar_url,
                    "message": f"Umefikisha streak ya {user.current_streak}! 🔥",
                    "streak": user.current_streak,
                },
            )


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
    from predictions.models import Match

    live_matches = Match.objects.filter(status="LIVE").select_related("home_team", "away_team", "league")
    updated_count = 0
    for match in live_matches:
        card, _created = Card.objects.get_or_create(type="LIVE_MATCH", match_id=match.id, defaults={"data": {}})
        card.data = {
            "match": {
                "home_team": match.home_team.name, "away_team": match.away_team.name,
                "league": match.league.name,
                "score": {"home": match.home_score or 0, "away": match.away_score or 0},
            }
        }
        card.save(update_fields=["data"])
        updated_count += 1

    return f"Live cards updated: {updated_count}"


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
            continue
        closes_at = datetime.fromisoformat(closes_at_str)
        if timezone.now() >= closes_at:
            # Funga voting (is_closed=True) lakini result inabaki None mpaka admin aiweke
            debate.data["voting_closed"] = True
            debate.save(update_fields=["data"])
            closed_count += 1

    return f"Debates zilizofungwa voting: {closed_count}"