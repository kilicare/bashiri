from celery import shared_task
from django.utils import timezone
from django.db.models import F
from django.core.cache import cache
from asgiref.sync import async_to_sync
import logging

from .models import UserTip, TipPerformance, TipVote, TipShare
from predictions.models import Match

logger = logging.getLogger(__name__)


from .verification import verify_tip, VerificationResult


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
                
                # Determine if prediction was correct using centralized verification engine
                verification_result = verify_tip(
                    tip.market_key, tip.selection, home_score, away_score
                )
                
                # Update tip status based on verification result
                old_status = tip.status
                tip.status = verification_result.value
                tip.verified_at = timezone.now()
                tip.save(update_fields=["status", "verified_at"])
                
                # Only update stats if status changed from PENDING (idempotency)
                if old_status == "PENDING":
                    # Update user performance stats
                    perf, _ = TipPerformance.objects.get_or_create(user=tip.user)
                    perf.total_tips += 1
                    
                    is_correct = verification_result == VerificationResult.WON
                    is_void = verification_result == VerificationResult.VOID
                    
                    if is_correct:
                        perf.correct_tips += 1
                        perf.current_streak += 1
                        if perf.current_streak > perf.best_streak:
                            perf.best_streak = perf.current_streak
                    elif is_void:
                        perf.void_tips += 1
                        # VOID does not reset streak
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
                
                elif tip.market_key == "DRAW_NO_BET":
                    perf.tips_dnb += 1
                    if is_correct:
                        perf.correct_dnb += 1
                
                # Update league-specific stats
                league_code = tip.match.league.code.lower() if tip.match.league else None
                if league_code:
                    if league_code in ['epl', 'premier league']:
                        perf.tips_epl += 1
                        if is_correct:
                            perf.correct_epl += 1
                    elif league_code in ['laliga', 'la liga']:
                        perf.tips_laliga += 1
                        if is_correct:
                            perf.correct_laliga += 1
                    elif league_code in ['seriea', 'serie a']:
                        perf.tips_seriea += 1
                        if is_correct:
                            perf.correct_seriea += 1
                    elif league_code in ['bundesliga']:
                        perf.tips_bundesliga += 1
                        if is_correct:
                            perf.correct_bundesliga += 1
                    elif league_code in ['ligue1', 'ligue 1']:
                        perf.tips_ligue1 += 1
                        if is_correct:
                            perf.correct_ligue1 += 1
                
                # Update recent form
                if not is_void:
                    perf.update_recent_form(is_correct)

                # Recalculate accuracies
                perf.calculate_accuracy()

                # Calculate tipster score
                perf.calculate_tipster_score()

                # Save TipPerformance to database
                perf.save()

                # Update user model
                tip.user.tip_accuracy = perf.accuracy_percentage
                tip.user.tipster_score = perf.tipster_score
                tip.user.current_streak = perf.current_streak
                tip.user.best_streak = perf.best_streak
                updated_users.add(tip.user.id)

                # ⭐ BROADCAST TIP VERIFICATION via WebSocket
                from tips.consumers import broadcast_tip_verified
                async_to_sync(broadcast_tip_verified)(
                    tip.id, tip.status, verification_result == VerificationResult.WON
                )

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
                user.tipster_score = perf.tipster_score
                user.current_streak = perf.current_streak
                user.best_streak = perf.best_streak
                user.save(update_fields=[
                    'tip_accuracy', 'tipster_score', 'current_streak', 'best_streak'
                ])
        
        # Invalidate leaderboard cache
        cache.delete("tips:leaderboard")
        cache.delete_pattern("tips:list:*")

        # ⭐ BROADCAST LEADERBOARD UPDATE
        from tips.consumers import broadcast_leaderboard_update
        from tips.serializers import TipPerformanceSerializer

        leaderboard = TipPerformance.objects.filter(
            total_tips__gte=10
        ).select_related('user').order_by('-accuracy_percentage')[:50]

        serializer = TipPerformanceSerializer(leaderboard, many=True)
        async_to_sync(broadcast_leaderboard_update)(serializer.data)

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


@shared_task(bind=True, max_retries=3)
def create_best_streak_card_task(self):
    """
    Create Best Streak User card for the feed.
    Runs daily at 5 AM via Celery Beat.
    """
    
    try:
        from django.utils import timezone
        from feed.models import Card
        from .models import TipPerformance
        
        today = timezone.localdate()
        
        # Get user with highest best_streak overall
        best_streak_user = TipPerformance.objects.filter(
            best_streak__gt=0
        ).order_by('-best_streak').first()
        
        if not best_streak_user:
            logger.info("No user with streak found")
            return {'status': 'success', 'message': 'No user with streak found'}
        
        # Check if card already exists for today
        existing_card = Card.objects.filter(
            type='BEST_STREAK_USER',
            created_at__date=today
        ).first()
        
        if existing_card:
            logger.info(f"Best Streak card already exists for {today}")
            return {'status': 'success', 'message': 'Card already exists for today'}
        
        # Create the card
        card = Card.objects.create(
            type='BEST_STREAK_USER',
            data={
                'user_id': best_streak_user.user.id,
                'username': best_streak_user.user.username,
                'avatar_url': best_streak_user.user.avatar_url,
                'verified_tipster': best_streak_user.user.verified_tipster,
                'best_streak': best_streak_user.best_streak,
                'total_tips': best_streak_user.total_tips,
                'accuracy': best_streak_user.accuracy_percentage,
                'current_streak': best_streak_user.current_streak,
            },
        )
        
        logger.info(f"Created Best Streak card for user {best_streak_user.user.username} with streak {best_streak_user.best_streak}")
        return {
            'status': 'success',
            'user': best_streak_user.user.username,
            'best_streak': best_streak_user.best_streak,
        }
    
    except Exception as exc:
        logger.error(f"create_best_streak_card_task failed: {str(exc)}")
        return {'status': 'error', 'error': str(exc)}


@shared_task(bind=True, max_retries=3)
def lock_tips_at_kickoff_task(self):
    """
    Lock tips when their matches start.
    Runs every minute via Celery Beat.
    """
    
    try:
        # Get tips for matches that have started but tips aren't locked yet
        from .models import UserTip
        
        tips_to_lock = UserTip.objects.filter(
            locked_at__isnull=True,
            match__kickoff_at__lte=timezone.now(),
            match__status="SCHEDULED"
        ).select_related("match")
        
        locked_count = 0
        for tip in tips_to_lock:
            try:
                tip.lock()
                locked_count += 1
            except Exception as e:
                logger.error(f"Error locking tip {tip.id}: {str(e)}")
                continue
        
        logger.info(f"lock_tips_at_kickoff_task: locked {locked_count} tips")
        return {
            'status': 'success',
            'locked_count': locked_count
        }
    
    except Exception as exc:
        logger.error(f"lock_tips_at_kickoff_task failed: {str(exc)}")
        raise self.retry(countdown=60, exc=exc)


@shared_task(bind=True, max_retries=3)
def verify_slips_task(self):
    """
    Verify tip slips when all legs are finished.
    Runs every 5 minutes via Celery Beat.
    """
    
    try:
        from .models import TipSlip, TipSlipLeg
        
        # Get pending slips that have all legs finished
        pending_slips = TipSlip.objects.filter(
            status="PENDING"
        ).prefetch_related('legs__tip__match')
        
        verified_count = 0
        
        for slip in pending_slips:
            try:
                # Check if all legs are verified
                all_verified = all(
                    leg.tip.status in ["CORRECT", "INCORRECT", "VOID"]
                    for leg in slip.legs.all()
                )
                
                if not all_verified:
                    continue
                
                # Update leg statuses to match tip statuses
                for leg in slip.legs.all():
                    leg.status = leg.tip.status
                    leg.save(update_fields=['status'])
                
                # Calculate aggregate status
                slip.calculate_aggregate_status()
                slip.verified_at = timezone.now()
                slip.save(update_fields=['status', 'verified_at'])
                
                # Update slip stats
                slip.total_legs = slip.legs.count()
                slip.won_legs = slip.legs.filter(status="CORRECT").count()
                slip.lost_legs = slip.legs.filter(status="INCORRECT").count()
                slip.void_legs = slip.legs.filter(status="VOID").count()
                slip.save(update_fields=['total_legs', 'won_legs', 'lost_legs', 'void_legs'])
                
                verified_count += 1
                
            except Exception as e:
                logger.error(f"Error verifying slip {slip.id}: {str(e)}")
                continue
        
        logger.info(f"verify_slips_task: verified {verified_count} slips")
        return {
            'status': 'success',
            'verified_count': verified_count
        }
    
    except Exception as exc:
        logger.error(f"verify_slips_task failed: {str(exc)}")
        raise self.retry(countdown=60, exc=exc)