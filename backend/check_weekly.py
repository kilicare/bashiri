import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from predictions.models import AIPick

week_ago = timezone.localdate() - timedelta(days=7)
weekly_picks = AIPick.objects.filter(created_at__date__gte=week_ago, feed='STANDARD')

print('Total weekly picks:', weekly_picks.count())
print('Weekly won:', weekly_picks.filter(status='WON').count())
print('Weekly lost:', weekly_picks.filter(status='LOST').count())

weekly_won = weekly_picks.filter(status='WON').count()
weekly_lost = weekly_picks.filter(status='LOST').count()
weekly_accuracy = round((weekly_won / (weekly_won + weekly_lost) * 100), 1) if (weekly_won + weekly_lost) > 0 else 0
print('Weekly accuracy:', weekly_accuracy, '%')
