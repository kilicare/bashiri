#!/bin/bash

set -e

echo "🚀 Starting Bashiri service: $SERVICE_TYPE"

if [ "$SERVICE_TYPE" = "sync" ]; then
    echo "🔄 Running historical data sync..."
    python manage.py sync_historical --seasons 2023 2024 2025 2026
    echo "✅ Sync completed. Exiting..."
    exit 0
fi

if [ "$SERVICE_TYPE" = "web" ]; then
    echo "📦 Running database migrations..."
    python manage.py migrate --noinput

    echo "📁 Collecting static files..."
    python manage.py collectstatic --noinput
fi

if [ "$SERVICE_TYPE" = "beat" ]; then
    echo "📦 Running database migrations..."
    python manage.py migrate --noinput
    
    echo "⏰ Setting up Celery Beat schedules..."
    python setup_celery_schedules.py || true
fi

echo "🌐 Starting service command..."
exec "$@"
