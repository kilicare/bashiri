#!/usr/bin/env python
"""Test sync_live_and_upcoming_matches task manually."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from predictions.tasks import sync_live_and_upcoming_matches

result = sync_live_and_upcoming_matches.delay()
print(f"Task ID: {result.id}")
print(f"Result: {result.get(timeout=120)}")
