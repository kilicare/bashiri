"""
predictions/management/commands/sync_historical.py

Historical synchronization command - Layer 1 of the two-layer architecture.

Imports historical football data for specific seasons.
This is a MANUAL command - NEVER schedule via Celery Beat.

Usage:
    python manage.py sync_historical --seasons 2023 2024 2025
    python manage.py sync_historical --seasons 2023 2024 2025 --dry-run
    python manage.py sync_historical --all-available

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


class Command(BaseCommand):
    help = (
        "Import historical football data for specific seasons. "
        "Manual command only - NEVER schedule via Celery Beat. "
        "Idempotent - safe to run multiple times."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--seasons",
            nargs="+",
            type=int,
            help="Seasons to import (e.g., 2023 2024 2025)",
        )
        parser.add_argument(
            "--all-available",
            action="store_true",
            help="Import all seasons available in your API subscription",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be imported without actually importing",
        )
        parser.add_argument(
            "--resume",
            action="store_true",
            help="Resume from last successful season (checks database)",
        )

    def handle(self, *args, **options):
        seasons = options.get("seasons")
        all_available = options.get("all_available")
        dry_run = options.get("dry_run")
        resume = options.get("resume")

        if not seasons and not all_available:
            self.stderr.write(
                self.style.ERROR("Must specify --seasons or --all-available")
            )
            return

        if seasons and all_available:
            self.stderr.write(
                self.style.ERROR("Cannot use both --seasons and --all-available")
            )
            return

        # Determine seasons to sync
        if all_available:
            # Default to recent seasons that are typically available on free tier
            # User can modify this based on their API subscription
            seasons = [2023, 2024, 2025]
            self.stdout.write(
                f"Using default seasons for --all-available: {seasons}"
            )

        if resume:
            seasons = self._filter_completed_seasons(seasons)
            if not seasons:
                self.stdout.write(
                    self.style.SUCCESS("All seasons already imported. Nothing to do.")
                )
                return

        self.stdout.write(
            f"\n{'='*60}\n"
            f"HISTORICAL SYNC - Layer 1\n"
            f"{'='*60}\n"
            f"Seasons to import: {seasons}\n"
            f"Mode: {'DRY RUN' if dry_run else 'LIVE IMPORT'}\n"
            f"{'='*60}\n"
        )

        if dry_run:
            self._dry_run(seasons)
            return

        total_created = 0
        total_updated = 0
        total_skipped = 0
        failed_seasons = []

        for season in seasons:
            self.stdout.write(f"\n{'='*60}")
            self.stdout.write(f"Processing Season {season}")
            self.stdout.write(f"{'='*60}")

            try:
                # For historical data, we sync the entire season
                # Season typically runs from August to May of following year
                # Special case for 2025: extend to December 2026 to capture World Cup 2026
                if season == 2025:
                    date_from = f"{season}-08-01"
                    date_to = "2026-12-31"
                else:
                    date_from = f"{season}-08-01"
                    date_to = f"{season + 1}-06-30"

                results = sync_all_leagues(date_from, date_to)

                season_created = sum(created for created, _, _ in results.values())
                season_updated = sum(updated for _, updated, _ in results.values())
                season_skipped = sum(skipped for _, _, skipped in results.values())
                total_created += season_created
                total_updated += season_updated
                total_skipped += season_skipped

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Season {season}: {season_created} created, "
                        f"{season_updated} updated, {season_skipped} skipped"
                    )
                )

            except AuthenticationError as e:
                self.stderr.write(
                    self.style.ERROR(f"Authentication error for season {season}: {e}")
                )
                self.stderr.write(
                    "This season may not be available in your API subscription."
                )
                failed_seasons.append(season)
                continue

            except RateLimitError as e:
                self.stderr.write(
                    self.style.ERROR(f"Rate limit hit for season {season}: {e}")
                )
                failed_seasons.append(season)
                continue

            except FootballDataSyncError as e:
                self.stderr.write(
                    self.style.ERROR(f"Sync error for season {season}: {e}")
                )
                failed_seasons.append(season)
                continue

            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f"Unexpected error for season {season}: {e}")
                )
                failed_seasons.append(season)
                continue

        # Summary
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write("HISTORICAL SYNC SUMMARY")
        self.stdout.write(f"{'='*60}")
        self.stdout.write(f"Total matches created: {total_created}")
        self.stdout.write(f"Total matches updated: {total_updated}")
        self.stdout.write(f"Total matches skipped: {total_skipped}")
        self.stdout.write(f"Successful seasons: {len(seasons) - len(failed_seasons)}")
        
        if failed_seasons:
            self.stderr.write(
                self.style.WARNING(f"Failed seasons: {failed_seasons}")
            )
            self.stderr.write(
                "You can retry failed seasons individually using --seasons"
            )

        self.stdout.write(
            self.style.SUCCESS("\nHistorical sync completed.")
        )

    def _dry_run(self, seasons):
        """Show what would be imported without actually importing."""
        self.stdout.write("DRY RUN MODE - No changes will be made\n")
        
        for season in seasons:
            self.stdout.write(f"Season {season}:")
            self.stdout.write(f"  Date range: {season}-08-01 to {season+1}-06-30")
            self.stdout.write(f"  Leagues: PL (EPL), PD (LaLiga), BL1 (Bundesliga), FL1 (Ligue 1)")
            self.stdout.write(f"  Expected: ~380 matches per league per season")
            self.stdout.write("")

        self.stdout.write(
            "To perform actual import, remove --dry-run flag."
        )

    def _filter_completed_seasons(self, seasons):
        """
        Filter out seasons that already have sufficient data.
        This enables resume functionality.
        """
        from predictions.models import Match
        
        completed_seasons = []
        remaining_seasons = []
        
        for season in seasons:
            # Check if we have a reasonable number of matches for this season
            season_start = timezone.datetime(season, 8, 1)
            season_end = timezone.datetime(season + 1, 6, 30)
            
            match_count = Match.objects.filter(
                kickoff_at__gte=season_start,
                kickoff_at__lte=season_end
            ).count()
            
            # If we have > 1000 matches, consider this season complete
            # (4 leagues × ~380 matches = ~1520 expected)
            if match_count > 1000:
                completed_seasons.append(season)
                self.stdout.write(
                    f"Season {season} already has {match_count} matches - skipping"
                )
            else:
                remaining_seasons.append(season)
                self.stdout.write(
                    f"Season {season} has {match_count} matches - will import"
                )
        
        if completed_seasons:
            self.stdout.write(
                f"Skipping completed seasons: {completed_seasons}"
            )
        
        return remaining_seasons
