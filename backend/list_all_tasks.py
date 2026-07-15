from django_celery_beat.models import PeriodicTask

tasks = PeriodicTask.objects.filter(enabled=True).order_by('name')

print('ENABLED PERIODIC TASKS:')
print('=' * 50)

for t in tasks:
    print(f'{t.name}:')
    print(f'  Task: {t.task}')
    if t.interval:
        print(f'  Schedule: Every {t.interval.every} {t.interval.period}')
    elif t.crontab:
        print(f'  Schedule: Crontab - {t.crontab.minute}:{t.crontab.hour} (day_of_week={t.crontab.day_of_week})')
    else:
        print(f'  Schedule: NOT SET!')
    print(f'  Last run: {t.last_run_at}')
    print()
