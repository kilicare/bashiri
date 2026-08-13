from django.core.management.base import BaseCommand
from predictions.models import Match, League

class Command(BaseCommand):
    help = 'Check database for leagues and matches'

    def handle(self, *args, **options):
        self.stdout.write(f'Total matches: {Match.objects.count()}')
        self.stdout.write(f'Total leagues: {League.objects.count()}')
        self.stdout.write('Active leagues:')
        
        for league in League.objects.filter(is_active=True):
            self.stdout.write(f'  - {league.name} ({league.poisson_key})')
        
        self.stdout.write('\nRecent matches:')
        for match in Match.objects.all()[:5]:
            self.stdout.write(f'  - {match.home_team.name} vs {match.away_team.name} ({match.league.name}) - {match.status}')