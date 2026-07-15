"""
predictions/services/sync_service.py

Reusable service layer for football-data.org synchronization.
Shared by both historical and daily sync commands to avoid code duplication.
"""
import logging
import time
from datetime import timedelta
from typing import Dict, List, Optional, Tuple

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from predictions.models import League, Match, Team

logger = logging.getLogger(__name__)

# Configuration constants with defaults
RATE_LIMIT_SLEEP = 6.5
STATUS_MAP = {
    "SCHEDULED": "SCHEDULED", "TIMED": "SCHEDULED",
    "IN_PLAY": "LIVE", "PAUSED": "LIVE",
    "FINISHED": "FINISHED", "POSTPONED": "POSTPONED",
    "CANCELLED": "CANCELLED", "SUSPENDED": "POSTPONED",
}

LEAGUE_SEED = [
    {"code": "PL", "name": "Premier League", "poisson_key": "EPL"},
    {"code": "PD", "name": "La Liga", "poisson_key": "LaLiga"},
    {"code": "BL1", "name": "Bundesliga", "poisson_key": "Bundesliga"},
    {"code": "FL1", "name": "Ligue 1", "poisson_key": "Ligue1"},
    {"code": "WC", "name": "FIFA World Cup 2026", "poisson_key": "WorldCup"},
]


class FootballDataSyncError(Exception):
    """Base exception for sync-related errors."""
    pass


class RateLimitError(FootballDataSyncError):
    """Raised when API rate limit is hit."""
    pass


class AuthenticationError(FootballDataSyncError):
    """Raised when API authentication fails."""
    pass


def get_api_headers() -> Dict[str, str]:
    """Get authenticated headers for football-data.org API."""
    api_key = settings.FOOTBALL_DATA_API_KEY
    if not api_key:
        raise FootballDataSyncError("FOOTBALL_DATA_API_KEY not configured in settings")
    return {"X-Auth-Token": api_key}


def ensure_leagues_exist() -> Dict[str, League]:
    """
    Ensure all required leagues exist in database.
    Returns dict mapping league codes to League objects.
    """
    leagues = {}
    for seed in LEAGUE_SEED:
        league, created = League.objects.update_or_create(
            code=seed["code"],
            defaults={"name": seed["name"], "poisson_key": seed["poisson_key"]},
        )
        leagues[seed["code"]] = league
        if created:
            logger.info(f"Created new league: {league.name} ({league.code})")
    return leagues


def get_or_create_team(league: League, team_data: Dict) -> Team:
    """
    Get or create a team from football-data.org API data.
    Uses external_id for uniqueness to handle team name changes.
    """
    team, created = Team.objects.update_or_create(
        external_id=team_data["id"],
        defaults={
            "league": league,
            "name": team_data["name"],
            "crest_url": team_data.get("crest") or "",
        },
    )
    if created:
        logger.info(f"Created new team: {team.name} (external_id={team.external_id})")
    return team


def sync_match_from_api(
    league: League,
    match_data: Dict,
    home_team: Team,
    away_team: Team
) -> Tuple[Match, bool]:
    """
    Sync a single match from API data to database.
    Returns (match, created) tuple.
    """
    kickoff_at = parse_datetime(match_data["utcDate"])
    status = STATUS_MAP.get(match_data["status"], "SCHEDULED")
    stage = match_data.get("stage") or ""
    group_name = match_data.get("group") or ""
    is_knockout = stage not in ("", "GROUP_STAGE", "REGULAR_SEASON")
    
    match, created = Match.objects.update_or_create(
        external_id=match_data["id"],
        defaults={
            "league": league,
            "home_team": home_team,
            "away_team": away_team,
            "kickoff_at": kickoff_at,
            "matchday": match_data.get("matchday"),
            "stage": stage,
            "group_name": group_name,
            "status": status,
            "home_score": match_data["score"]["fullTime"]["home"],
            "away_score": match_data["score"]["fullTime"]["away"],
            "last_event": match_data.get("lastEvent", ""),
            "is_big_match": is_knockout,
        },
    )
    return match, created


def fetch_matches_from_api(
    league_code: str,
    date_from: str,
    date_to: str,
    headers: Dict[str, str],
    base_url: Optional[str] = None
) -> List[Dict]:
    """
    Fetch matches from football-data.org API for a specific league and date range.
    Handles rate limiting and authentication errors gracefully.
    """
    if base_url is None:
        base_url = settings.BASHIRI["FOOTBALL_DATA_BASE_URL"]
    
    url = f"{base_url}/competitions/{league_code}/matches"
    params = {"dateFrom": date_from, "dateTo": date_to}
    
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=15)
    except requests.RequestException as e:
        raise FootballDataSyncError(f"Network error fetching {league_code}: {e}")
    
    # Handle rate limiting with retry
    retry_count = 0
    max_retries = 3
    while resp.status_code == 429 and retry_count < max_retries:
        retry_count += 1
        wait_time = 60 * retry_count  # Exponential backoff: 60s, 120s, 180s
        logger.warning(
            f"[SYNC] Rate limited for {league_code} (attempt {retry_count}/{max_retries}), "
            f"waiting {wait_time}s..."
        )
        time.sleep(wait_time)
        resp = requests.get(url, headers=headers, params=params, timeout=15)
        
        if resp.status_code == 429 and retry_count == max_retries:
            raise RateLimitError(
                f"Rate limit exceeded for {league_code} after {max_retries} retries"
            )
    
    # Handle authentication errors
    if resp.status_code == 403 or resp.status_code == 401:
        raise AuthenticationError(
            f"Authentication failed for {league_code}. Check API key and subscription."
        )
    
    # Handle other errors
    if resp.status_code != 200:
        raise FootballDataSyncError(
            f"API error {resp.status_code} for {league_code}: {resp.text}"
        )
    
    data = resp.json()
    return data.get("matches", [])


def sync_league_matches(
    league: League,
    date_from: str,
    date_to: str,
    headers: Dict[str, str]
) -> Tuple[int, int, int]:
    """
    Sync all matches for a league within a date range.
    Returns (created_count, updated_count, skipped_count) tuple.
    """
    start_time = time.time()
    logger.info(f"[SYNC] Fetching {league.name} ({league.code}) from {date_from} to {date_to}...")
    
    matches_data = fetch_matches_from_api(league.code, date_from, date_to, headers)
    downloaded_count = len(matches_data)
    logger.info(f"[SYNC] Downloaded {downloaded_count} matches from API")
    
    created_count = 0
    updated_count = 0
    skipped_count = 0
    
    # Use transaction for atomicity - if anything fails, roll back the entire league
    with transaction.atomic():
        for match_data in matches_data:
            try:
                home_team = get_or_create_team(league, match_data["homeTeam"])
                away_team = get_or_create_team(league, match_data["awayTeam"])
                
                match, created = sync_match_from_api(league, match_data, home_team, away_team)
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
                    
            except Exception as e:
                logger.error(f"[SYNC] Error syncing match {match_data.get('id')}: {e}")
                skipped_count += 1
                continue
    
    elapsed_time = time.time() - start_time
    logger.info(
        f"[SYNC] {league.name}: {created_count} created, {updated_count} updated, "
        f"{skipped_count} skipped | {downloaded_count} downloaded | "
        f"Elapsed: {elapsed_time:.2f}s"
    )
    
    return created_count, updated_count, skipped_count


def sync_all_leagues(
    date_from: str,
    date_to: str,
    rate_limit_sleep: float = RATE_LIMIT_SLEEP
) -> Dict[str, Tuple[int, int, int]]:
    """
    Sync matches for all configured leagues within a date range.
    Returns dict mapping league codes to (created, updated, skipped) tuples.
    """
    overall_start = time.time()
    logger.info(f"[SYNC] Starting sync for all leagues from {date_from} to {date_to}")
    
    headers = get_api_headers()
    leagues = ensure_leagues_exist()
    
    results = {}
    total_created = 0
    total_updated = 0
    total_skipped = 0
    
    for code, league in leagues.items():
        try:
            created, updated, skipped = sync_league_matches(league, date_from, date_to, headers)
            results[code] = (created, updated, skipped)
            total_created += created
            total_updated += updated
            total_skipped += skipped
        except FootballDataSyncError as e:
            logger.error(f"[SYNC] Failed to sync {league.name}: {e}")
            results[code] = (0, 0, 0)
        except Exception as e:
            logger.error(f"[SYNC] Unexpected error syncing {league.name}: {e}")
            results[code] = (0, 0, 0)
        
        # Rate limiting between leagues
        time.sleep(rate_limit_sleep)
    
    overall_elapsed = time.time() - overall_start
    logger.info(
        f"[SYNC] COMPLETED: {total_created} created, {total_updated} updated, "
        f"{total_skipped} skipped | Total elapsed: {overall_elapsed:.2f}s"
    )
    
    return results


def calculate_sync_window(
    days_back: int = 7,
    days_forward: int = 14,
    reference_date: Optional[timezone.datetime] = None
) -> Tuple[str, str]:
    """
    Calculate date range for sync operations.
    Returns (date_from, date_to) as YYYY-MM-DD strings.
    """
    if reference_date is None:
        reference_date = timezone.now()
    
    date_from = (reference_date - timedelta(days=days_back)).strftime("%Y-%m-%d")
    date_to = (reference_date + timedelta(days=days_forward)).strftime("%Y-%m-%d")
    
    return date_from, date_to
