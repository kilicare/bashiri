#!/usr/bin/env python
"""
Run Django web server with gunicorn for production.
Runs migrations before starting the server.
"""
import os
import sys
import subprocess

def run_migrations():
    """Run database migrations."""
    print("📦 Running database migrations...")
    try:
        subprocess.run(['python', 'manage.py', 'migrate', '--noinput'], check=True)
        print("✅ Database migrations completed")
    except Exception as e:
        print(f"⚠️ Warning: Failed to run migrations: {e}")
        print("Continuing with web server startup...")

def collect_static():
    """Collect static files."""
    print("📁 Collecting static files...")
    try:
        subprocess.run(['python', 'manage.py', 'collectstatic', '--noinput'], check=True)
        print("✅ Static files collected")
    except Exception as e:
        print(f"⚠️ Warning: Failed to collect static files: {e}")
        print("Continuing with web server startup...")

def run_gunicorn():
    """Run gunicorn web server."""
    print("🚀 Starting Gunicorn web server...")
    
    # Get configuration from environment
    bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:8000')
    workers = os.environ.get('GUNICORN_WORKERS', '4')
    timeout = os.environ.get('GUNICORN_TIMEOUT', '120')
    
    cmd = [
        'gunicorn',
        'config.wsgi:application',
        '--bind', bind,
        '--workers', workers,
        '--timeout', timeout,
        '--access-logfile', '-',
        '--error-logfile', '-',
        '--log-level', 'info'
    ]
    
    subprocess.run(cmd)

if __name__ == '__main__':
    run_migrations()
    collect_static()
    run_gunicorn()
