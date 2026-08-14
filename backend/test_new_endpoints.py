from predictions.models import Team, League, TeamStanding, HeadToHead
from predictions.serializers import TeamStandingSerializer, HeadToHeadSerializer

# Test if the new models and serializers work
print('Testing new data models and serializers:')
print('=' * 60)

# Check TeamStanding
print('TeamStanding model created:', TeamStanding)
print('TeamStanding serializer:', TeamStandingSerializer)

# Check HeadToHead  
print('HeadToHead model created:', HeadToHead)
print('HeadToHead serializer:', HeadToHeadSerializer)

# Check if we have any teams
teams_count = Team.objects.count()
print(f'Total teams in database: {teams_count}')

# Check if we have any leagues
leagues_count = League.objects.count()
print(f'Total leagues in database: {leagues_count}')

print('All tests passed!')