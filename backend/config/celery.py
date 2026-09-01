"""BASHIRI — Celery Application. Injini ya scheduled tasks."""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("bashiri")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Celery Beat Schedule
app.conf.beat_schedule = {
    # Tip verification (every 5 minutes)
    'verify-tips': {
        'task': 'tips.tasks.verify_tips_task',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    
    # Lock tips at kickoff (every minute)
    'lock-tips-at-kickoff': {
        'task': 'tips.tasks.lock_tips_at_kickoff_task',
        'schedule': crontab(minute='*'),  # Every minute
    },
    
    # Verify slips (every 5 minutes)
    'verify-slips': {
        'task': 'tips.tasks.verify_slips_task',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    
    # Update leaderboard (every 10 minutes)
    'update-leaderboard': {
        'task': 'tips.tasks.update_leaderboard_task',
        'schedule': crontab(minute='*/10'),  # Every 10 minutes
    },
    
    # Clean old shares (daily at 3 AM)
    'clean-old-shares': {
        'task': 'tips.tasks.clean_old_shares_task',
        'schedule': crontab(hour=3, minute=0),
    },
    
    # Sync live and upcoming matches (every minute)
    'sync-live-matches': {
        'task': 'predictions.tasks.sync_live_and_upcoming_matches',
        'schedule': crontab(minute='*'),  # Every minute
    },
    
    # Sync recently finished matches (every 30 minutes)
    'sync-finished-matches': {
        'task': 'predictions.tasks.sync_recently_finished_matches',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    
    # Generate daily AI picks (daily at 4 AM) - NEW AI PICK SYSTEM
    'generate-daily-ai-picks': {
        'task': 'predictions.ai_pick_tasks.generate_daily_ai_picks',
        'schedule': crontab(hour=4, minute=0),
    },
    
    # Update AI pick status (every 10 minutes) - NEW AI PICK SYSTEM
    'update-ai-pick-status': {
        'task': 'predictions.ai_pick_tasks.update_pick_status_periodic',
        'schedule': crontab(minute='*/10'),
    },
    
    # Generate AI track record snapshot (daily at 4 AM)
    'generate-ai-track-record': {
        'task': 'predictions.tasks.generate_ai_track_record_snapshot',
        'schedule': crontab(hour=4, minute=0),
    },
    
    # Fetch live odds (every 5 minutes)
    'fetch-live-odds': {
        'task': 'predictions.tasks.fetch_live_odds_task',
        'schedule': crontab(minute='*/5'),
    },
    
    # Fetch upcoming odds (every 15 minutes)
    'fetch-upcoming-odds': {
        'task': 'predictions.tasks.fetch_upcoming_odds_task',
        'schedule': crontab(minute='*/15'),
    },
    
    # Fetch team standings (daily at midnight)
    'fetch-team-standings': {
        'task': 'predictions.tasks.fetch_team_standings_task',
        'schedule': crontab(hour=0, minute=0),
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
