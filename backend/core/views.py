"""
core/views.py — Health check endpoint kuthibitisha Django, PostgreSQL,
na Redis zinaongea kabla ya kuendelea na Phase 1/2.
"""
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.conf import settings
import redis


@require_GET
def health_check(request):
    status = {
        "bashiri": "ok",
        "database": "unknown",
        "redis": "unknown",
        "version": "1.0.0",
    }
    http_status = 200

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status["database"] = "ok"
    except Exception as e:
        status["database"] = f"error: {e}"
        http_status = 503

    try:
        r = redis.from_url(settings.CELERY_BROKER_URL)
        r.ping()
        status["redis"] = "ok"
    except Exception as e:
        status["redis"] = f"error: {e}"
        http_status = 503

    return JsonResponse(status, status=http_status)
