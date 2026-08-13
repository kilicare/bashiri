"""
predictions/management/commands/sync_daily.py

Daily synchronization command - Layer 2 of the two-layer architecture.

Lightweight incremental updater for recent and upcoming matches.
This command is designed for frequent execution (e.g., via Celery Beat).

Usage:
    python manage.py sync_daily
    python manage.py sync_daily --days-back 1 --days-forward 2
    python manage.py sync_daily --dry-run

This command is safe to run multiple times - it uses update_or_create
and only syncs a small date window for performance.
"""
import logging
from django.core.management.base import BaseCommand
from django.conf import settings

from predictions.sync_service import (
    sync_all_leagues,
    calculate_sync_window,
    FootballDataSyncError,
    AuthenticationError,
    RateLimitError,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Daily incremental sync for recent and upcoming matches. "
        "Lightweight and fast - designed for Celery Beat scheduling. "
        "Safe to run multiple times."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--days-back",
            type=int,
            default=int(settings.BASHIRI.get("DAILY_SYNC_DAYS_BACK", 1)),
            help="Days back from today to sync (default: 1)",
        )
        parser.add_argument(
            "--days-forward",
            type=int,
            default=int(settings.BASHIRI.get("DAILY_SYNC_DAYS_FORWARD", 2)),
            help="Days forward from today to sync (default: 2)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be synced without actually syncing",
        )

    def handle(self, *args, **options):
        days_back = options["days_back"]
        days_forward = options["days_forward"]
        dry_run = options["dry_run"]

        date_from, date_to = calculate_sync_window(days_back, days_forward)

        self.stdout.write(
            f"\n{'='*60}\n"
            f"DAILY SYNC - Layer 2\n"
            f"{'='*60}\n"
            f"Date range: {date_from} to {date_to}\n"
            f"Days back: {days_back}, Days forward: {days_forward}\n"
            f"Mode: {'DRY RUN' if dry_run else 'LIVE SYNC'}\n"
            f"{'='*60}\n"
        )

        if dry_run:
            self._dry_run(date_from, date_to)
            return

        try:
            results = sync_all_leagues(date_from, date_to)

            total_created = sum(created for created, _, _ in results.values())
            total_updated = sum(updated for _, updated, _ in results.values())
            total_skipped = sum(skipped for _, _, skipped in results.values())

            self.stdout.write(f"\n{'='*60}")
            self.stdout.write("DAILY SYNC SUMMARY")
            self.stdout.write(f"{'='*60}")
            self.stdout.write(f"Total matches created: {total_created}")
            self.stdout.write(f"Total matches updated: {total_updated}")
            self.stdout.write(f"Total matches skipped: {total_skipped}")
            
            for league_code, (created, updated, skipped) in results.items():
                self.stdout.write(
                    f"  {league_code}: {created} created, {updated} updated, {skipped} skipped"
                )

            self.stdout.write(
                self.style.SUCCESS("\nDaily sync completed successfully.")
            )

        except AuthenticationError as e:
            self.stderr.write(
                self.style.ERROR(f"Authentication error: {e}")
            )
            self.stderr.write(
                "Check your FOOTBALL_DATA_API_KEY and subscription status."
            )
            raise

        except RateLimitError as e:
            self.stderr.write(
                self.style.ERROR(f"Rate limit error: {e}")
            )
            self.stderr.write(
                "Wait before retrying or reduce sync frequency."
            )
            raise

        except FootballDataSyncError as e:
            self.stderr.write(
                self.style.ERROR(f"Sync error: {e}")
            )
            raise

        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f"Unexpected error: {e}")
            )
            logger.exception("Unexpected error in daily sync")
            raise

    def _dry_run(self, date_from: str, date_to: str):
        """Show what would be synced without actually syncing."""
        self.stdout.write("DRY RUN MODE - No changes will be made\n")
        self.stdout.write(f"Date range: {date_from} to {date_to}")
        self.stdout.write("Leagues: PL (EPL), PD (LaLiga), BL1 (Bundesliga), FL1 (Ligue 1),")
        self.stdout.write("          WC (WorldCup), BSA (Brasileirao), ELC (Championship),")
        self.stdout.write("          DED (Eredivisie), EC (European Championship), PPL (Primeira Liga),")
        self.stdout.write("          SA (Serie A), CL (UEFA Champions League)")
        self.stdout.write("")
        self.stdout.write("To perform actual sync, remove --dry-run flag.")
