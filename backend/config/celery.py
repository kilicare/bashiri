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
}


@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
