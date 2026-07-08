from django_celery_beat.models import CrontabSchedule, PeriodicTask


def make_task(name, task, cron_kwargs):
    schedule, _ = CrontabSchedule.objects.get_or_create(**cron_kwargs)
    PeriodicTask.objects.get_or_create(name=name, defaults={"crontab": schedule, "task": task})


make_task("Notify Daily Picks", "notifications.tasks.notify_daily_picks", {"minute": "0", "hour": "7"})
make_task("Notify Favorite Team Matches", "notifications.tasks.notify_favorite_team_matches", {"minute": "*/30", "hour": "*"})
make_task("Notify High Confidence Picks", "notifications.tasks.notify_high_confidence_picks", {"minute": "0", "hour": "8"})

print("Tasks added successfully")
