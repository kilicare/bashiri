"""
One-off script to generate demo AI picks from existing finished matches.
This is for demonstration purposes to populate the AIPick table with historical data.
"""

import os
import django
import uuid
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.db import transaction
from predictions.models import Match, AIPick

def generate_demo_picks():
    """Generate demo AI picks from recent finished matches."""
    today = timezone.localdate()
    month_ago = today - timedelta(days=30)

    # Get finished matches from last 30 days
    matches = Match.objects.filter(
        kickoff_at__date__gte=month_ago,
        status='FINISHED',
        home_score__isnull=False,
        away_score__isnull=False
    ).select_related('league', 'home_team', 'away_team')[:100]

    picks_created = 0

    for match in matches:
        # Skip if pick already exists
        if AIPick.objects.filter(match=match).exists():
            continue

        # Generate a simulated pick based on actual result
        # This is for demo purposes - real picks should come from prediction model
        home_score = match.home_score
        away_score = match.away_score

        # Simple logic: pick the winning market
        if home_score > away_score:
            market = "1x2_home"
            selection = "Home"
            probability = 0.65
        elif away_score > home_score:
            market = "1x2_away"
            selection = "Away"
            probability = 0.65
        else:
            market = "1x2_draw"
            selection = "Draw"
            probability = 0.25

        # Calculate actual result
        actual_home = match.home_score
        actual_away = match.away_score

        # Determine result
        if market == "1x2_home":
            result = "WON" if actual_home > actual_away else "LOST"
        elif market == "1x2_away":
            result = "WON" if actual_away > actual_home else "LOST"
        elif market == "1x2_draw":
            result = "WON" if actual_home == actual_away else "LOST"
        else:
            result = "LOST"

        # Randomly vary probability for realism
        import random
        probability = max(0.50, min(0.90, probability + random.uniform(-0.10, 0.10)))

        # Determine tier
        if probability >= 0.80:
            tier = "ELITE"
        elif probability >= 0.60:
            tier = "STRONG"
        else:
            tier = "MINIMUM"

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

    print(f"Created {picks_created} demo AI picks")

if __name__ == "__main__":
    generate_demo_picks()
