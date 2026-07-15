from feed.models import Card
from predictions.models import Match
from django.utils import timezone
from datetime import timedelta

now = timezone.now()
today = timezone.localdate()

print(f'Today: {today}')
print(f'Current time: {now}')

# Check AI_PICK cards created today
ai_picks_today = Card.objects.filter(
    type='AI_PICK',
    created_at__date=today
).select_related('match', 'match__home_team', 'match__away_team', 'match__league')

print(f'\nAI_PICK cards created today: {ai_picks_today.count()}')
for card in ai_picks_today:
    print(f'  {card.data.get("match", {}).get("home_team")} vs {card.data.get("match", {}).get("away_team")} - {card.data.get("match", {}).get("kickoff_at")}')

# Check if generate_daily_picks task ran
print(f'\nChecking todays matches for AI_PICK generation:')
todays_matches = Match.objects.filter(
    kickoff_at__date=today, 
    status='SCHEDULED'
).select_related('home_team', 'away_team', 'league')

for m in todays_matches:
    print(f'  {m.home_team.name} vs {m.away_team.name} (League: {m.league.name}, Poisson key: {m.league.poisson_key})')
    
    # Check if AI_PICK card exists
    has_ai_pick = Card.objects.filter(type='AI_PICK', match_id=m.id).exists()
    print(f'    Has AI_PICK card: {has_ai_pick}')
    
    # Try to generate prediction manually
    try:
        from predictions.ml.poisson_model import predict_fixture
        prediction = predict_fixture(m.league.poisson_key, m.home_team.name, m.away_team.name)
        print(f'    Prediction would work: {prediction["ai_pick"]["selection"]} ({prediction["ai_pick"]["confidence"]}%)')
    except Exception as e:
        print(f'    Prediction failed: {e}')
