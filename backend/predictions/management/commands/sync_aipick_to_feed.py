from django.core.management.base import BaseCommand
from predictions.models import AIPick, Match
from predictions.ai_pick_config import get_market_label
from feed.models import Card


class Command(BaseCommand):
    help = 'Sync AIPick data to feed cards for display'

    def handle(self, *args, **options):
        # Clear existing AI pick cards
        deleted = Card.objects.filter(type__in=['AI_PICK', 'BIG_MATCH']).delete()
        self.stdout.write(f'Deleted {deleted} old AI pick cards')

        # Create feed cards from AIPick data - use actual AIPick fields
        created = 0
        for pick in AIPick.objects.filter(feed='STANDARD').select_related('match').order_by('-created_at')[:50]:
            match = pick.match
            card_type = "BIG_MATCH" if match.is_big_match else "AI_PICK"

            Card.objects.create(
                type=card_type,
                match_id=match.id,
                data={
                    'match': {
                        'id': match.id,
                        'home_team': pick.home_team,
                        'away_team': pick.away_team,
                        'home_team_crest_url': match.home_team.crest_url if match.home_team else None,
                        'away_team_crest_url': match.away_team.crest_url if match.away_team else None,
                        'kickoff_at': match.kickoff_at.isoformat(),
                        'league': pick.league,
                    },
                    'ai_pick': {
                        'selection': pick.selection,
                        'selection_label': get_market_label(pick.market),
                        'market_label': get_market_label(pick.market),
                        'probability_percent': pick.probability_percent,
                        'tier': pick.tier,
                        'status': pick.status,
                        'pick_id': str(pick.pick_id),
                        'actual_home_score': pick.actual_home_score,
                        'actual_away_score': pick.actual_away_score,
                        'result': pick.result,
                    }
                }
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(f'Created {created} feed cards from AIPick data'))
