import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tips.models import UserTip, TipPerformance
from accounts.models import User

u = User.objects.get(username='lastmateru')
tips = UserTip.objects.filter(user=u)
print('Total tips:', tips.count())
print('Status breakdown:')
for status in ['PENDING', 'CORRECT', 'INCORRECT', 'VOID']:
    print(f'  {status}:', tips.filter(status=status).count())

print('\nTipPerformance stats:')
try:
    perf = TipPerformance.objects.get(user=u)
    print(f'total_tips: {perf.total_tips}')
    print(f'correct_tips: {perf.correct_tips}')
    print(f'accuracy_percentage: {perf.accuracy_percentage}')
except TipPerformance.DoesNotExist:
    print('No TipPerformance record found')
