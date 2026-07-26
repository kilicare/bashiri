#!/usr/bin/env python
"""Setup Celery Beat schedules for Bashiri."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django_celery_beat.models import CrontabSchedule, PeriodicTask, IntervalSchedule


def make_task(name, task, cron_kwargs):
    schedule, _ = CrontabSchedule.objects.get_or_create(**cron_kwargs)
    obj, created = PeriodicTask.objects.get_or_create(name=name, defaults={"crontab": schedule, "task": task})
    if not created:
        obj.crontab = schedule
        obj.task = task
        obj.enabled = True
        obj.save()
    print(f"{'Imeundwa' if created else 'Imethibitishwa'}: {name}")


def make_interval_task(name, task, every_minutes):
    schedule, _ = IntervalSchedule.objects.get_or_create(every=every_minutes, period=IntervalSchedule.MINUTES)
    obj, created = PeriodicTask.objects.get_or_create(name=name, defaults={"interval": schedule, "task": task})
    if not created:
        obj.interval = schedule
        obj.crontab = None
        obj.enabled = True
        obj.save()
    print(f"{'Imeundwa' if created else 'Imethibitishwa'}: {name}")


def make_interval_task_seconds(name, task, every_seconds):
    schedule, _ = IntervalSchedule.objects.get_or_create(every=every_seconds, period=IntervalSchedule.SECONDS)
    obj, created = PeriodicTask.objects.get_or_create(name=name, defaults={"interval": schedule, "task": task})
    if not created:
        obj.interval = schedule
        obj.crontab = None
        obj.enabled = True
        obj.save()
    print(f"{'Imeundwa' if created else 'Imethibitishwa'}: {name}")


# Sync KAMILI — mara moja kwa siku (fixtures mpya + backup ya matokeo)
make_task("Sync Football Data", "predictions.tasks.sync_daily_task", {"minute": "0", "hour": "3"})

# Historical Sync — mara moja tu kwa import data ya 2023, 2024, 2025, 2026 (ENABLED for now)
# DISABLE after completion by commenting out this line
make_task("Historical Sync 2023-2026", "predictions.tasks.sync_historical_task", {"minute": "0", "hour": "2"})

# Sync NDOGO — mpya, kila sekunde 15 (status/score za mechi za sasa) - production safe
make_interval_task_seconds("Quick Sync Live Matches", "predictions.tasks.sync_live_and_upcoming_matches", 15)

# Sync mechi zilizoisha hivi karibuni — kila dakika 30
make_interval_task("Sync Recently Finished Matches", "predictions.tasks.sync_recently_finished_matches", 30)

# AI Picks — kila siku asubuhi
make_task("Generate Daily Picks", "predictions.tasks.generate_daily_picks", {"minute": "0", "hour": "6"})

# Feed tasks
make_task("Generate Result Recaps", "feed.tasks.generate_result_recaps", {"minute": "*/30", "hour": "*"})
make_task("Generate Stat Cards", "feed.tasks.generate_stat_cards", {"minute": "0", "hour": "5"})
make_task("Generate Poll Cards", "feed.tasks.generate_poll_cards", {"minute": "0", "hour": "5"})
make_interval_task_seconds("Update Live Match Cards", "feed.tasks.update_live_match_cards", 15)
make_task("Generate Weekly Report", "feed.tasks.generate_weekly_report", {"minute": "0", "hour": "20", "day_of_week": "0"})
make_task("Generate Did You Know Cards", "feed.tasks.generate_did_you_know_cards", {"minute": "30", "hour": "5"})
make_task("Close Expired Debates", "feed.tasks.close_expired_debates", {"minute": "0", "hour": "*"})
make_interval_task("Deactivate Finished Live Cards", "feed.tasks.deactivate_finished_live_cards", 1)

# Notifications
make_task("Notify Daily Picks", "notifications.tasks.notify_daily_picks", {"minute": "0", "hour": "7"})
make_task("Notify Morning Picks", "notifications.tasks.notify_morning_picks", {"minute": "0", "hour": "9"})
make_task("Notify Favorite Team Matches", "notifications.tasks.notify_favorite_team_matches", {"minute": "*/30", "hour": "*"})
make_task("Notify High Confidence Picks", "notifications.tasks.notify_high_confidence_picks", {"minute": "0", "hour": "8"})
make_task("Notify Live Match Alerts", "notifications.tasks.notify_live_match_alerts", {"minute": "*/5", "hour": "*"})
make_task("Notify Evening Recap", "notifications.tasks.notify_evening_recap", {"minute": "0", "hour": "21"})
make_task("Notify Weekly Summary", "notifications.tasks.notify_weekly_summary", {"minute": "0", "hour": "10", "day_of_week": "1"})

# Bashiri Mic
make_task("Compute Fan of Match", "mic.tasks.compute_fan_of_match", {"minute": "0", "hour": "*"})
make_task("Generate Mic Winner Cards", "feed.tasks.generate_mic_winner_cards", {"minute": "0", "hour": "*"})

print("\n✅ Schedule zote zimeundwa/thibitishwa!")
