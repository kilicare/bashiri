"""BASHIRI config package. Celery app inaanzishwa hapa (import time)."""
from .celery import app as celery_app

__all__ = ("celery_app",)