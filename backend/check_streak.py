import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from predictions.models import AIPick

all_settled = AIPick.objects.filter(status__in=['WON', 'LOST']).order_by('settled_at')
current_streak = 0
best_streak = 0
temp_streak = 0

for pick in all_settled:
    if pick.status == 'WON':
        temp_streak += 1
        best_streak = max(best_streak, temp_streak)
    else:
        temp_streak = 0

print('Best streak:', best_streak)
print('Current streak:', temp_streak)
