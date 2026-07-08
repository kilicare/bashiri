"""core/management/commands/setup_celery_beat.py"""
from django.core.management.base import BaseCommand

from django_celery_beat.models import CrontabSchedule, PeriodicTask


class Command(BaseCommand):
    help = "Setup Celery Beat periodic tasks"

    def handle(self, *args, **options):
        def make_task(name, task, cron_kwargs):
            schedule, _ = CrontabSchedule.objects.get_or_create(**cron_kwargs)
            PeriodicTask.objects.get_or_create(name=name, defaults={"crontab": schedule, "task": task})

        make_task("Sync Football Data", "predictions.tasks.sync_football_data_task", {"minute": "0", "hour": "3"})
        make_task("Generate Daily Picks", "predictions.tasks.generate_daily_picks", {"minute": "0", "hour": "6"})
        make_task("Generate Result Recaps", "feed.tasks.generate_result_recaps", {"minute": "*/30", "hour": "*"})
        make_task("Generate Stat Cards", "feed.tasks.generate_stat_cards", {"minute": "0", "hour": "5"})
        make_task("Generate Poll Cards", "feed.tasks.generate_poll_cards", {"minute": "0", "hour": "5"})
        make_task("Update Live Match Cards", "feed.tasks.update_live_match_cards", {"minute": "*/2", "hour": "*"})
        make_task("Generate Weekly Report", "feed.tasks.generate_weekly_report", {"minute": "0", "hour": "20", "day_of_week": "0"})

        self.stdout.write(self.style.SUCCESS("Celery Beat periodic tasks created successfully."))
