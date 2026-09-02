import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tips.models import UserTip, TipPerformance
from accounts.models import User

u = User.objects.get(username='lastmateru')
tips = UserTip.objects.filter(user=u)

# Recalculate TipPerformance
perf, _ = TipPerformance.objects.get_or_create(user=u)

# Reset counts
perf.total_tips = 0
perf.correct_tips = 0
perf.incorrect_tips = 0
perf.void_tips = 0
perf.current_streak = 0
perf.best_streak = 0

# Recalculate from tips
for tip in tips:
    perf.total_tips += 1
    if tip.status == 'CORRECT':
        perf.correct_tips += 1
        perf.current_streak += 1
        if perf.current_streak > perf.best_streak:
            perf.best_streak = perf.current_streak
    elif tip.status == 'INCORRECT':
        perf.incorrect_tips += 1
        perf.current_streak = 0
    elif tip.status == 'VOID':
        perf.void_tips += 1

# Calculate accuracy (only settled tips: CORRECT + INCORRECT)
settled_count = perf.correct_tips + perf.incorrect_tips
if settled_count > 0:
    perf.accuracy_percentage = round((perf.correct_tips / settled_count) * 100, 1)
else:
    perf.accuracy_percentage = 0.0

perf.save()

# Update user model
u.tip_accuracy = perf.accuracy_percentage
u.current_streak = perf.current_streak
u.best_streak = perf.best_streak
u.save(update_fields=['tip_accuracy', 'current_streak', 'best_streak'])

print(f'Updated TipPerformance for {u.username}:')
print(f'total_tips: {perf.total_tips}')
print(f'correct_tips: {perf.correct_tips}')
print(f'accuracy_percentage: {perf.accuracy_percentage}')
print(f'current_streak: {perf.current_streak}')
print(f'best_streak: {perf.best_streak}')
