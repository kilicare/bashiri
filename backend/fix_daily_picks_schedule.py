from django_celery_beat.models import PeriodicTask, IntervalSchedule
from django.db import transaction

with transaction.atomic():
    task = PeriodicTask.objects.select_for_update().get(name='Generate Daily Picks')
    
    # Clear existing schedules
    task.crontab = None
    task.interval = None
    task.save()
    
    # Set daily schedule
    daily_schedule, _ = IntervalSchedule.objects.get_or_create(every=1, period='days')
    task.interval = daily_schedule
    task.save()
    
    print(f'Updated {task.name} to run daily')
    print(f'Interval: {task.interval.every} {task.interval.period}')
