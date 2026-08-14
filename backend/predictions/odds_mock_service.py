"""
predictions/odds_mock_service.py

Mock odds service for development and testing when The Odds API is unavailable.
Creates realistic odds data for demonstration purposes.
"""
import random
from datetime import timedelta
from django.utils import timezone
from .models import League, Match, OddsBookmaker

BOOKMAKERS = [
    "Bet365", "DraftKings", "Betfair", "FanDuel", "William Hill"
]

def generate_mock_odds(match, is_live=False):
    """Generate realistic mock odds for a match."""
    mock_bookmakers = []
    
    # Generate base odds for home/draw/away
    home_strength = random.uniform(0.3, 0.7)
    away_strength = 1.0 - home_strength
    draw_strength = random.uniform(0.2, 0.3)
    
    # Convert to decimal odds
    home_odds = round(1 / (home_strength * 0.9), 2)  # Add bookmaker margin
    draw_odds = round(1 / (draw_strength * 0.9), 2)
    away_odds = round(1 / (away_strength * 0.9), 2)
    
    # Over/Under 2.5 odds
    over_odds = round(random.uniform(1.8, 2.2), 2)
    under_odds = round(1 / (1/over_odds - 0.1), 2)
    
    # BTTS odds
    btts_yes = round(random.uniform(1.7, 2.1), 2)
    btts_no = round(1 / (1/btts_yes - 0.05), 2)
    
    for bookmaker in BOOKMAKERS:
        # Add some variation per bookmaker
        variation = random.uniform(0.95, 1.05)
        
        for market_type in ["1X2", "OVER_UNDER_2_5", "BTTS"]:
            odds_data = {
                "match": match,
                "bookmaker_name": bookmaker,
                "market_type": market_type,
                "is_live": is_live,
            }
            
            if market_type == "1X2":
                odds_data.update({
                    "home_win_odds": round(home_odds * variation, 2),
                    "draw_odds": round(draw_odds * variation, 2),
                    "away_win_odds": round(away_odds * variation, 2),
                })
            elif market_type == "OVER_UNDER_2_5":
                odds_data.update({
                    "over_odds": round(over_odds * variation, 2),
                    "under_odds": round(under_odds * variation, 2),
                })
            elif market_type == "BTTS":
                odds_data.update({
                    "btts_yes_odds": round(btts_yes * variation, 2),
                    "btts_no_odds": round(btts_no * variation, 2),
                })
            
            mock_bookmakers.append(OddsBookmaker(**odds_data))
    
    return OddsBookmaker.objects.bulk_create(mock_bookmakers)


def generate_mock_odds_for_league(league_code, days_ahead=7, is_live=False):
    """Generate mock odds for upcoming matches in a league."""
    try:
        league = League.objects.get(code=league_code)
    except League.DoesNotExist:
        return 0
    
    # Get upcoming matches
    from django.utils import timezone
    end_date = timezone.now() + timedelta(days=days_ahead)
    
    matches = Match.objects.filter(
        league=league,
        status="SCHEDULED",
        kickoff_at__gte=timezone.now(),
        kickoff_at__lte=end_date
    )[:10]  # Limit to 10 matches for demo
    
    total_created = 0
    for match in matches:
        # Delete existing odds for this match
        OddsBookmaker.objects.filter(match=match).delete()
        
        # Generate new mock odds
        created = generate_mock_odds(match, is_live)
        total_created += len(created)
    
    return total_created


def generate_all_mock_odds(is_live=False):
    """Generate mock odds for all active leagues."""
    total_created = 0
    active_leagues = League.objects.filter(is_active=True)
    
    for league in active_leagues:
        created = generate_mock_odds_for_league(league.code, days_ahead=7, is_live=is_live)
        total_created += created
        print(f"Generated {created} mock odds for {league.name}")
    
    return total_created