from celery import shared_task
from django.utils import timezone
from django.db.models import F
from django.core.cache import cache
import logging

from .models import UserTip, TipPerformance, TipVote, TipShare
from predictions.models import Match

logger = logging.getLogger(__name__)


def is_prediction_correct(market_key, selection, home_score, away_score):
    """
    Determine if a prediction is correct based on final match score
    """
    total_goals = home_score + away_score
    
    if market_key == "1X2":
        if selection == "home_win" and home_score > away_score:
            return True
        elif selection == "draw" and home_score == away_score:
            return True
        elif selection == "away_win" and away_score > home_score:
            return True
    
    elif market_key == "DRAW_NO_BET":
        if selection == "home_win" and home_score > away_score:
            return True
        elif selection == "away_win" and away_score > home_score:
            return True
    
    elif market_key.startswith("OVER_UNDER"):
        threshold = int(market_key.split("_")[-1])
        if selection.startswith("over") and total_goals > threshold:
            return True
        elif selection.startswith("under") and total_goals < threshold:
            return True
    
    elif market_key == "BTTS":
        if selection == "both_teams_score_yes" and home_score > 0 and away_score > 0:
            return True
        elif selection == "both_teams_score_no" and (home_score == 0 or away_score == 0):
            return True
    
    elif market_key == "DOUBLE_CHANCE":
        if selection == "home_win_or_draw" and home_score >= away_score:
            return True
        elif selection == "draw_or_away_win" and away_score >= home_score:
            return True
        elif selection == "home_win_or_away_win" and home_score != away_score:
            return True
    
    return False


@shared_task(bind=True, max_retries=3)
def verify_tips_task(self):
    """
    Verify pending tips when matches finish.
    Runs every 5 minutes via Celery Beat.
    """
    
    try:
        # Get pending tips for finished matches
        pending_tips = UserTip.objects.filter(
            status="PENDING",
            match__status="FINISHED"
        ).select_related("match", "user").iterator(chunk_size=100)
        
        verified_count = 0
        updated_users = set()
        
        for tip in pending_tips:
            try:
                home_score = tip.match.home_score
                away_score = tip.match.away_score
                
                # Determine if prediction was correct
                is_correct = is_prediction_correct(
                    tip.market_key, tip.selection, home_score, away_score
                )
                
                # Update tip status
                tip.status = "CORRECT" if is_correct else "INCORRECT"
                tip.verified_at = timezone.now()
                tip.save(update_fields=["status", "verified_at"])
                
                # Update user performance stats
                perf, _ = TipPerformance.objects.get_or_create(user=tip.user)
                perf.total_tips += 1
                
                if is_correct:
                    perf.correct_tips += 1
                    perf.current_streak += 1
                    if perf.current_streak > perf.best_streak:
                        perf.best_streak = perf.current_streak
                else:
                    perf.incorrect_tips += 1
                    perf.current_streak = 0
                
                # Update market-specific stats
                if tip.market_key == "1X2":
                    perf.tips_1x2 += 1
                    if is_correct:
                        perf.correct_1x2 += 1
                
                elif tip.market_key == "BTTS":
                    perf.tips_btts += 1
                    if is_correct:
                        perf.correct_btts += 1
                
                elif tip.market_key.startswith("OVER_UNDER"):
                    perf.tips_over_under += 1
                    if is_correct:
                        perf.correct_over_under += 1
                
                elif tip.market_key == "DOUBLE_CHANCE":
                    perf.tips_double_chance += 1
                    if is_correct:
                        perf.correct_double_chance += 1
                
                # Recalculate accuracies
                perf.calculate_accuracy()
                
                # Update user model
                tip.user.tip_accuracy = perf.accuracy_percentage
                tip.user.current_streak = perf.current_streak
                tip.user.best_streak = perf.best_streak
                updated_users.add(tip.user.id)
                
                verified_count += 1
                
            except Exception as e:
                logger.error(f"Error verifying tip {tip.id}: {str(e)}")
                continue
        
        # Bulk update user streaks
        if updated_users:
            from accounts.models import User
            users = User.objects.filter(id__in=updated_users)
            for user in users:
                perf = user.tip_performance
                user.tip_accuracy = perf.accuracy_percentage
                user.current_streak = perf.current_streak
                user.best_streak = perf.best_streak
                user.save(update_fields=[
                    'tip_accuracy', 'current_streak', 'best_streak'
                ])
        
        # Invalidate leaderboard cache
        cache.delete("tips:leaderboard")
        cache.delete_pattern("tips:list:*")
        
        logger.info(f"verify_tips_task: verified {verified_count} tips")
        return {
            'status': 'success',
            'verified_count': verified_count
        }
    
    except Exception as exc:
        logger.error(f"verify_tips_task failed: {str(exc)}")
        # Retry after 60 seconds
        raise self.retry(countdown=60, exc=exc)


@shared_task
def update_leaderboard_task():
    """
    Update leaderboard rankings and cache.
    Runs every 10 minutes.
    """
    
    try:
        # Get top performers
        leaderboard = TipPerformance.objects.filter(
            total_tips__gte=10
        ).select_related('user').order_by(
            '-accuracy_percentage', '-total_tips'
        )[:100]
        
        # Cache results
        from .serializers import TipPerformanceSerializer
        serializer = TipPerformanceSerializer(leaderboard, many=True)
        cache.set("tips:leaderboard", serializer.data, 600)  # 10 min cache
        
        logger.info("Leaderboard cache updated")
        return {'status': 'success', 'updated_count': len(leaderboard)}
    
    except Exception as e:
        logger.error(f"update_leaderboard_task failed: {str(e)}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def clean_old_shares_task():
    """
    Clean up old share records (older than 30 days).
    Runs daily.
    """
    
    try:
        from datetime import timedelta
        cutoff_date = timezone.now() - timedelta(days=30)
        
        from .models import TipShare
        deleted_count, _ = TipShare.objects.filter(
            created_at__lt=cutoff_date
        ).delete()
        
        logger.info(f"Cleaned {deleted_count} old share records")
        return {'status': 'success', 'deleted_count': deleted_count}
    
    except Exception as e:
        logger.error(f"clean_old_shares_task failed: {str(e)}")
        return {'status': 'error', 'error': str(e)}