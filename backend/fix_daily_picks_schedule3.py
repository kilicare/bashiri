from django_celery_beat.models import PeriodicTask, CrontabSchedule

task = PeriodicTask.objects.get(name='Generate Daily Picks')

# Create a daily crontab schedule (runs every day at 6 AM)
crontab_schedule, _ = CrontabSchedule.objects.get_or_create(
    minute=0,
    hour=6,
    day_of_week='*',
    day_of_month='*',
    month_of_year='*',
)

# Set the crontab schedule
task.interval = None
task.crontab = crontab_schedule
task.save()

print(f'Updated {task.name} to run daily at 6 AM')
print(f'Crontab: minute={task.crontab.minute}, hour={task.crontab.hour}')
