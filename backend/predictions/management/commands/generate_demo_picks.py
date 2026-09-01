from django.core.management.base import BaseCommand
import uuid
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from predictions.models import Match, AIPick
import random


class Command(BaseCommand):
    help = 'Generate demo AI picks from existing finished matches'

    def handle(self, *args, **options):
        # Clear existing demo picks
        AIPick.objects.filter(model_version="demo_v1").delete()
        
        today = timezone.localdate()
        month_ago = today - timedelta(days=30)

        # Get finished matches from last 30 days
        matches = Match.objects.filter(
            kickoff_at__date__gte=month_ago,
            status='FINISHED',
            home_score__isnull=False,
            away_score__isnull=False
        ).select_related('league', 'home_team', 'away_team')[:150]

        picks_created = 0

        for match in matches:
            # Generate a simulated pick based on actual result
            home_score = match.home_score
            away_score = match.away_score

            # Randomly choose a market
            markets = ["1x2_home", "1x2_away", "1x2_draw", "btts_yes", "btts_no", "over_1_5", "under_1_5"]
            market = random.choice(markets)
            
            # Set selection based on market
            if market == "1x2_home":
                selection = "Home"
            elif market == "1x2_away":
                selection = "Away"
            elif market == "1x2_draw":
                selection = "Draw"
            elif market == "btts_yes":
                selection = "Yes"
            elif market == "btts_no":
                selection = "No"
            elif market == "over_1_5":
                selection = "Over"
            elif market == "under_1_5":
                selection = "Under"
            else:
                selection = "Home"

            # Randomly vary probability
            probability = random.uniform(0.55, 0.85)

            # Determine tier
            if probability >= 0.80:
                tier = "ELITE"
            elif probability >= 0.60:
                tier = "STRONG"
            else:
                tier = "MINIMUM"

            # Calculate actual result
            actual_home = match.home_score
            actual_away = match.away_score
            total_goals = actual_home + actual_away

            # Determine result based on market and actual score
            if market == "1x2_home":
                result = "WON" if actual_home > actual_away else "LOST"
            elif market == "1x2_away":
                result = "WON" if actual_away > actual_home else "LOST"
            elif market == "1x2_draw":
                result = "WON" if actual_home == actual_away else "LOST"
            elif market == "btts_yes":
                result = "WON" if actual_home >= 1 and actual_away >= 1 else "LOST"
            elif market == "btts_no":
                result = "WON" if actual_home == 0 or actual_away == 0 else "LOST"
            elif market == "over_1_5":
                result = "WON" if total_goals >= 2 else "LOST"
            elif market == "under_1_5":
                result = "WON" if total_goals <= 1 else "LOST"
            else:
                result = "LOST"

            with transaction.atomic():
                pick = AIPick.objects.create(
                    pick_id=uuid.uuid4(),
                    match=match,
                    home_team=match.home_team.name,
                    away_team=match.away_team.name,
                    league=match.league.name,
                    kickoff_at=match.kickoff_at,
                    market=market,
                    selection=selection,
                    probability=probability,
                    probability_percent=round(probability * 100, 1),
                    tier=tier,
                    feed="STANDARD",
                    status=result,  # Already settled
                    created_at=match.kickoff_at - timedelta(hours=2),
                    published_at=match.kickoff_at - timedelta(hours=1),
                    settled_at=match.kickoff_at + timedelta(hours=2),
                    model_version="demo_v1",
                    threshold_config_version="v1",
                    market_config_version="v1",
                    actual_home_score=actual_home,
                    actual_away_score=actual_away,
                    result=result,
                    settlement_version="v1",
                )
                picks_created += 1

        self.stdout.write(self.style.SUCCESS(f'Created {picks_created} demo AI picks'))
