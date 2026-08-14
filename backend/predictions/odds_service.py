"""
predictions/odds_service.py

Service layer for fetching and managing odds from The Odds API.
"""
import logging
import time
from datetime import timedelta
from typing import Dict, List, Optional

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import League, Match, OddsBookmaker, OddsUpdate

logger = logging.getLogger(__name__)

# The Odds API configuration
ODDS_API_BASE_URL = "https://api.theoddsapi.com"
RATE_LIMIT_SLEEP = 1.0  # 1 second between requests to respect rate limits


class OddsAPIError(Exception):
    """Base exception for odds API errors."""
    pass


class RateLimitError(OddsAPIError):
    """Raised when API rate limit is hit."""
    pass


def get_odds_api_headers() -> Dict[str, str]:
    """Get authenticated headers for The Odds API."""
    return {
        "Content-Type": "application/json",
    }


def map_league_to_odds_code(league_code: str) -> Optional[str]:
    """
    Map Bashiri league codes to The Odds API sport/league codes.
    Using FREE tier sport keys that don't require Pro plan.
    """
    league_mapping = {
        # These are the FREE tier sport keys from The Odds API
        "PL": "soccer_epl",  # Premier League - requires Pro, but let's try
        "PD": "soccer_la_liga",  # La Liga - FREE
        "BL1": "soccer_bundesliga",  # Bundesliga - FREE
        "FL1": "soccer_ligue_one",  # Ligue 1 - FREE
        "SA": "soccer_serie_a",  # Serie A - FREE
        "ELC": "soccer_championship",  # Championship - might be Pro
    }
    return league_mapping.get(league_code)


def fetch_live_odds_for_match(match_id: int) -> Optional[Dict]:
    """
    Fetch live odds for a specific match from The Odds API.
    Returns odds data or None if not available.
    """
    try:
        match = Match.objects.get(id=match_id)
        
        # Get the odds API league code
        odds_league = map_league_to_odds_code(match.league.code)
        if not odds_league:
            logger.warning(f"No odds API mapping for league: {match.league.code}")
            return None
        
        # The Odds API endpoint for live odds
        api_key = settings.ODDS_API_KEY
        if not api_key:
            raise OddsAPIError("ODDS_API_KEY not configured in settings")
            
        url = f"{ODDS_API_BASE_URL}/v4/sports/{odds_league}/odds-live"
        params = {
            "apiKey": api_key,
            "regions": "uk",  # UK/European odds
            "markets": "h2h,ou25,btts",  # Head-to-head, Over/Under 2.5, Both Teams to Score
            "oddsFormat": "decimal",
        }
        
        headers = get_odds_api_headers()
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Find the specific match in the response
        for event in data:
            # Match by team names (The Odds API doesn't use our match IDs)
            if (match.home_team.name.lower() in event.get("home_team", "").lower() and
                match.away_team.name.lower() in event.get("away_team", "").lower()):
                return event
        
        logger.info(f"No odds found for match {match_id}: {match.home_team} vs {match.away_team}")
        return None
        
    except requests.RequestException as e:
        logger.error(f"Error fetching odds for match {match_id}: {e}")
        return None
    except Match.DoesNotExist:
        logger.error(f"Match {match_id} does not exist")
        return None


def fetch_upcoming_odds_for_league(league_code: str, days_ahead: int = 7) -> List[Dict]:
    """
    Fetch upcoming odds for all matches in a league for the next N days.
    Returns list of odds data.
    """
    try:
        api_key = settings.ODDS_API_KEY
        if not api_key:
            raise OddsAPIError("ODDS_API_KEY not configured in settings")
            
        odds_league = map_league_to_odds_code(league_code)
        if not odds_league:
            logger.warning(f"No odds API mapping for league: {league_code}")
            return []
        
        url = f"{ODDS_API_BASE_URL}/v4/sports/{odds_league}/odds"
        params = {
            "apiKey": api_key,
            "regions": "uk",
            "markets": "h2h,ou25,btts",
            "oddsFormat": "decimal",
            "daysAhead": days_ahead,
        }
        
        headers = get_odds_api_headers()
        response = requests.get(url, params=params, headers=headers, timeout=15)
        response.raise_for_status()
        
        return response.json()
        
    except requests.RequestException as e:
        logger.error(f"Error fetching upcoming odds for league {league_code}: {e}")
        return []


def save_odds_to_database(match: Match, odds_data: Dict, is_live: bool = False) -> List[OddsBookmaker]:
    """
    Save odds data to database, creating OddsBookmaker entries.
    Returns list of created/updated OddsBookmaker objects.
    """
    if not odds_data or "bookmakers" not in odds_data:
        logger.warning(f"No bookmakers data in odds response for match {match.id}")
        return []
    
    saved_odds = []
    
    for bookmaker_data in odds_data["bookmakers"]:
        bookmaker_name = bookmaker_data.get("title", "Unknown")
        markets = bookmaker_data.get("markets", [])
        
        for market in markets:
            market_key = market.get("key")
            if market_key not in ["h2h", "ou25", "btts"]:
                continue  # Only handle markets we support
            
            # Map market keys to our market types
            market_type_mapping = {
                "h2h": "1X2",
                "ou25": "OVER_UNDER_2_5",
                "btts": "BTTS",
            }
            market_type = market_type_mapping.get(market_key, "1X2")
            
            # Get odds values
            outcomes = market.get("outcomes", [])
            odds_values = {
                "home_win_odds": None,
                "draw_odds": None,
                "away_win_odds": None,
                "over_odds": None,
                "under_odds": None,
                "btts_yes_odds": None,
                "btts_no_odds": None,
            }
            
            for outcome in outcomes:
                outcome_name = outcome.get("name", "").lower()
                price = outcome.get("price")
                
                if market_key == "h2h":
                    if "home" in outcome_name:
                        odds_values["home_win_odds"] = price
                    elif "draw" in outcome_name:
                        odds_values["draw_odds"] = price
                    elif "away" in outcome_name:
                        odds_values["away_win_odds"] = price
                elif market_key == "ou25":
                    if "over" in outcome_name:
                        odds_values["over_odds"] = price
                    elif "under" in outcome_name:
                        odds_values["under_odds"] = price
                elif market_key == "btts":
                    if "yes" in outcome_name:
                        odds_values["btts_yes_odds"] = price
                    elif "no" in outcome_name:
                        odds_values["btts_no_odds"] = price
            
            # Create or update OddsBookmaker
            with transaction.atomic():
                bookmaker_odds, created = OddsBookmaker.objects.update_or_create(
                    match=match,
                    bookmaker_name=bookmaker_name,
                    market_type=market_type,
                    defaults={
                        **odds_values,
                        "is_live": is_live,
                    }
                )
                
                # Create history snapshot if updating existing odds
                if not created:
                    # Only create history if values changed significantly
                    if (abs((bookmaker_odds.home_win_odds or 0) - (odds_values["home_win_odds"] or 0)) > 0.05 or
                        abs((bookmaker_odds.draw_odds or 0) - (odds_values["draw_odds"] or 0)) > 0.05 or
                        abs((bookmaker_odds.away_win_odds or 0) - (odds_values["away_win_odds"] or 0)) > 0.05):
                        
                        OddsUpdate.objects.create(
                            bookmaker_odds=bookmaker_odds,
                            home_win_odds=bookmaker_odds.home_win_odds,
                            draw_odds=bookmaker_odds.draw_odds,
                            away_win_odds=bookmaker_odds.away_win_odds,
                            over_odds=bookmaker_odds.over_odds,
                            under_odds=bookmaker_odds.under_odds,
                            btts_yes_odds=bookmaker_odds.btts_yes_odds,
                            btts_no_odds=bookmaker_odds.btts_no_odds,
                        )
                
                saved_odds.append(bookmaker_odds)
                logger.info(f"{'Created' if created else 'Updated'} odds: {bookmaker_name} - {match} ({market_type})")
    
    return saved_odds


def update_odds_for_match(match_id: int, is_live: bool = False) -> int:
    """
    Fetch and save odds for a specific match.
    Returns number of odds entries updated/created.
    """
    try:
        match = Match.objects.get(id=match_id)
        odds_data = fetch_live_odds_for_match(match_id)
        
        if not odds_data:
            return 0
        
        saved_odds = save_odds_to_database(match, odds_data, is_live)
        return len(saved_odds)
        
    except Match.DoesNotExist:
        logger.error(f"Match {match_id} does not exist")
        return 0
    except Exception as e:
        logger.error(f"Error updating odds for match {match_id}: {e}")
        return 0


def update_odds_for_league(league_code: str, is_live: bool = False) -> int:
    """
    Fetch and save odds for all upcoming matches in a league.
    Returns number of odds entries updated/created.
    """
    try:
        odds_data_list = fetch_upcoming_odds_for_league(league_code)
        total_updated = 0
        
        for odds_data in odds_data_list:
            # Match by team names
            home_team_name = odds_data.get("home_team", "")
            away_team_name = odds_data.get("away_team", "")
            
            try:
                match = Match.objects.filter(
                    home_team__name__icontains=home_team_name,
                    away_team__name__icontains=away_team_name,
                    status="SCHEDULED"
                ).first()
                
                if match:
                    saved_odds = save_odds_to_database(match, odds_data, is_live)
                    total_updated += len(saved_odds)
                    time.sleep(RATE_LIMIT_SLEEP)  # Respect rate limits
                    
            except Exception as e:
                logger.error(f"Error processing odds for {home_team_name} vs {away_team_name}: {e}")
                continue
        
        logger.info(f"Updated {total_updated} odds entries for league {league_code}")
        return total_updated
        
    except Exception as e:
        logger.error(f"Error updating odds for league {league_code}: {e}")
        return 0


def update_all_league_odds(is_live: bool = False) -> Dict[str, int]:
    """
    Update odds for all active leagues.
    Returns dict mapping league codes to number of updates.
    """
    results = {}
    active_leagues = League.objects.filter(is_active=True)
    
    for league in active_leagues:
        updated_count = update_odds_for_league(league.code, is_live)
        results[league.code] = updated_count
        time.sleep(RATE_LIMIT_SLEEP * 2)  # Extra delay between leagues
    
    return results