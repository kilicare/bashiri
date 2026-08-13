"""
predictions/management/commands/sync_historical.py

Historical synchronization command - Layer 1 of the two-layer architecture.

Imports historical football data for specific seasons per league.
This is a MANUAL command - NEVER schedule via Celery Beat.

Usage:
    python manage.py sync_historical --all-available
    python manage.py sync_historical --all-available --dry-run
    python manage.py sync_historical --leagues EPL LaLiga

This command is idempotent - running it multiple times will not duplicate data.
It uses update_or_create for all database operations.
"""
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone

from predictions.sync_service import (
    sync_all_leagues,
    FootballDataSyncError,
    AuthenticationError,
    RateLimitError,
)

logger = logging.getLogger(__name__)

# League code mapping and their specific seasons
LEAGUE_SEASONS = {
    "EPL": [2023, 2024, 2025, 2026],
    "LaLiga": [2023, 2024, 2025, 2026],
    "Bundesliga": [2023, 2024, 2025, 2026],
    "Ligue1": [2023, 2024, 2025, 2026],
    "WorldCup": [2018, 2022, 2026],
    "Eredivisie": [2023, 2024, 2025, 2026],
    "Brasileirao Serie A": [2023, 2024, 2025, 2026],
    "Championship": [2023, 2024, 2025, 2026],
    "UEFA Champions League": [2023, 2024, 2025, 2026],
    "European Championship": [2020, 2024],
    "Serie A": [2023, 2024, 2025, 2026],
    "Primeira Liga": [2023, 2024, 2025, 2026]
}


class Command(BaseCommand):
    help = (
        "Import historical football data for specific seasons. "
        "Manual command only - NEVER schedule via Celery Beat. "
        "Idempotent - safe to run multiple times."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--all-available",
            action="store_true",
            help="Import all available seasons for all leagues",
        )
        parser.add_argument(
            "--leagues",
            nargs="+",
            help="Specific leagues to import (e.g., EPL LaLiga WorldCup)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be imported without actually importing",
        )

    def handle(self, *args, **options):
        all_available = options.get("all_available")
        specific_leagues = options.get("leagues")
        dry_run = options.get("dry_run")

        if not all_available and not specific_leagues:
            self.stderr.write(
                self.style.ERROR("Must specify --all-available or --leagues")
            )
            return

        # Determine which leagues to sync
        leagues_to_sync = specific_leagues if specific_leagues else list(LEAGUE_SEASONS.keys())

        self.stdout.write(
            f"\n{'='*60}\n"
            f"HISTORICAL SYNC - Layer 1\n"
            f"{'='*60}\n"
            f"Leagues to sync: {', '.join(leagues_to_sync)}\n"
            f"Mode: {'DRY RUN' if dry_run else 'LIVE IMPORT'}\n"
            f"{'='*60}\n"
        )

        if dry_run:
            self._dry_run(leagues_to_sync)
            return

        total_created = 0
        total_updated = 0
        total_skipped = 0
        failed_syncs = []

        for league_name in leagues_to_sync:
            if league_name not in LEAGUE_SEASONS:
                self.stderr.write(
                    self.style.WARNING(f"Unknown league: {league_name} - skipping")
                )
                continue

            seasons = LEAGUE_SEASONS[league_name]
            self.stdout.write(f"\n{'='*60}")
            self.stdout.write(f"Processing {league_name} - Seasons: {seasons}")
            self.stdout.write(f"{'='*60}")

            for season in seasons:
                try:
                    # Calculate date range based on league type
                    date_from, date_to = self._get_season_date_range(league_name, season)

                    self.stdout.write(f"  Season {season}: {date_from} to {date_to}")

                    results = sync_all_leagues(date_from, date_to)

                    season_created = sum(created for created, _, _ in results.values())
                    season_updated = sum(updated for _, updated, _ in results.values())
                    season_skipped = sum(skipped for _, _, skipped in results.values())
                    total_created += season_created
                    total_updated += season_updated
                    total_skipped += season_skipped

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"    {season}: {season_created} created, "
                            f"{season_updated} updated, {season_skipped} skipped"
                        )
                    )

                except AuthenticationError as e:
                    self.stderr.write(
                        self.style.ERROR(f"    Authentication error for {league_name} {season}: {e}")
                    )
                    failed_syncs.append(f"{league_name} {season}")
                    continue

                except RateLimitError as e:
                    self.stderr.write(
                        self.style.ERROR(f"    Rate limit hit for {league_name} {season}: {e}")
                    )
                    failed_syncs.append(f"{league_name} {season}")
                    continue

                except FootballDataSyncError as e:
                    self.stderr.write(
                        self.style.ERROR(f"    Sync error for {league_name} {season}: {e}")
                    )
                    failed_syncs.append(f"{league_name} {season}")
                    continue

                except Exception as e:
                    self.stderr.write(
                        self.style.ERROR(f"    Unexpected error for {league_name} {season}: {e}")
                    )
                    failed_syncs.append(f"{league_name} {season}")
                    continue

        # Summary
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write("HISTORICAL SYNC SUMMARY")
        self.stdout.write(f"{'='*60}")
        self.stdout.write(f"Total matches created: {total_created}")
        self.stdout.write(f"Total matches updated: {total_updated}")
        self.stdout.write(f"Total matches skipped: {total_skipped}")
        
        if failed_syncs:
            self.stderr.write(
                self.style.WARNING(f"Failed syncs: {failed_syncs}")
            )

        self.stdout.write(
            self.style.SUCCESS("\nHistorical sync completed.")
        )

    def _get_season_date_range(self, league_name: str, season: int) -> tuple:
        """Calculate date range for a specific league and season."""
        # Domestic leagues typically Aug to May/Jun
        domestic_leagues = ["EPL", "LaLiga", "Bundesliga", "Ligue1", "Eredivisie", 
                          "Brasileirao Serie A", "Championship", "Serie A", "Primeira Liga"]
        
        # International tournaments have different schedules
        if league_name == "WorldCup":
            # World Cup is typically Nov-Dec
            if season == 2018:
                return "2018-06-14", "2018-07-15"
            elif season == 2022:
                return "2022-11-20", "2022-12-18"
            elif season == 2026:
                return "2026-06-11", "2026-07-19"
            else:
                return f"{season}-06-01", f"{season}-07-31"
        
        elif league_name == "European Championship":
            # Euro is typically Jun-Jul
            if season == 2020:
                return "2021-06-11", "2021-07-11"  # Held in 2021 due to COVID
            elif season == 2024:
                return "2024-06-14", "2024-07-14"
            else:
                return f"{season}-06-01", f"{season}-07-31"
        
        elif league_name == "UEFA Champions League":
            # UCL runs Sep to Jun of following year
            return f"{season}-09-01", f"{season + 1}-06-30"
        
        elif league_name in domestic_leagues:
            # Domestic leagues Aug to May/Jun
            if season == 2026:
                # Current/next season - extend further
                return f"{season}-08-01", "2026-12-31"
            else:
                return f"{season}-08-01", f"{season + 1}-06-30"
        
        else:
            # Default to Aug to Jun
            return f"{season}-08-01", f"{season + 1}-06-30"

    def _dry_run(self, leagues_to_sync):
        """Show what would be imported without actually importing."""
        self.stdout.write("DRY RUN MODE - No changes will be made\n")
        
        for league_name in leagues_to_sync:
            if league_name not in LEAGUE_SEASONS:
                continue
            seasons = LEAGUE_SEASONS[league_name]
            self.stdout.write(f"{league_name}:")
            for season in seasons:
                date_from, date_to = self._get_season_date_range(league_name, season)
                self.stdout.write(f"  Season {season}: {date_from} to {date_to}")
            self.stdout.write("")

        self.stdout.write(
            "To perform actual import, remove --dry-run flag."
        )
