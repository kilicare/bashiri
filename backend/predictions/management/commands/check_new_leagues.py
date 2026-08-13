from django.core.management.base import BaseCommand
from predictions.models import Match, League

class Command(BaseCommand):
    help = 'Check recent matches from newly added leagues'

    def handle(self, *args, **options):
        new_leagues = ['Brasileirao Serie A', 'Championship', 'Eredivisie', 
                       'European Championship', 'Primeira Liga', 'Serie A', 'UEFA Champions League']
        
        self.stdout.write('Recent matches from newly added leagues:')
        self.stdout.write('=' * 60)
        
        for league_name in new_leagues:
            try:
                league = League.objects.get(name=league_name)
                matches = Match.objects.filter(league=league).order_by('-kickoff_at')[:3]
                
                if matches.exists():
                    self.stdout.write(f'\n{league_name} ({league.poisson_key}):')
                    for match in matches:
                        self.stdout.write(f'  - {match.home_team.name} vs {match.away_team.name} - {match.status} ({match.kickoff_at.strftime("%Y-%m-%d")})')
                else:
                    self.stdout.write(f'\n{league_name}: No matches yet')
            except League.DoesNotExist:
                self.stdout.write(f'\n{league_name}: League not found in database')