import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bashiri.settings')
django.setup()

from predictions.models import Match
from django.utils import timezone
from datetime import timedelta

now = timezone.now()
start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
end_date = now + timedelta(days=30)

matches = Match.objects.filter(
    status='SCHEDULED',
    kickoff_at__gte=start_date,
    kickoff_at__lte=end_date
).select_related('league', 'home_team', 'away_team').order_by('kickoff_at')

print(f'Total matches in range: {matches.count()}')
print('Leagues distribution:')
from django.db.models import Count
leagues = matches.values('league__name').annotate(count=Count('id')).order_by('league__name')
for item in leagues:
    print(f'  {item["league__name"]}: {item["count"]}')

print('\nFirst 50 matches:')
first_50 = matches[:50]
for m in first_50:
    print(f"  {m.league.name}: {m.home_team.name} vs {m.away_team.name} - {m.kickoff_at}")
