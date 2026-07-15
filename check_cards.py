from feed.models import Card
from predictions.models import Match
from django.utils import timezone
from datetime import timedelta

now = timezone.now()
today = timezone.localdate()

print(f'Today: {today}')
print(f'Current time: {now}')

todays_matches = Match.objects.filter(
    kickoff_at__date=today, 
    status='SCHEDULED'
).select_related('home_team', 'away_team', 'league')

print(f'\nTodays matches: {todays_matches.count()}')
for m in todays_matches:
    print(f'{m.kickoff_at}: {m.home_team.name} vs {m.away_team.name}')

print('\nCards for todays matches:')
for m in todays_matches:
    cards = Card.objects.filter(match_id=m.id)
    print(f'  {m.home_team.name} vs {m.away_team.name}: {cards.count()} cards')
    for c in cards:
        print(f'    - {c.type} (created: {c.created_at})')
