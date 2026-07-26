#!/usr/bin/env python
"""
Run Celery worker with dummy HTTP server for Render compatibility.
Celery runs in background, HTTP server runs on port 8000 for health checks.
"""
import os
import sys
import subprocess
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

class HealthHandler(BaseHTTPRequestHandler):
    """Simple health check handler for Render."""
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Suppress default logging."""
        pass

def run_http_server():
    """Run HTTP server in background."""
    server = HTTPServer(('0.0.0.0', 8000), HealthHandler)
    print("🌐 Health check server running on port 8000")
    server.serve_forever()

def run_celery_worker():
    """Run Celery worker."""
    print("🚀 Starting Celery worker...")
    concurrency = os.environ.get('CELERY_CONCURRENCY', '1')
    cmd = [
        'celery', '-A', 'config', 'worker',
        '--loglevel=info',
        f'--concurrency={concurrency}'
    ]
    subprocess.run(cmd)

if __name__ == '__main__':
    # Start HTTP server in background thread
    http_thread = threading.Thread(target=run_http_server, daemon=True)
    http_thread.start()
    
    # Give HTTP server time to start
    time.sleep(2)
    
    # Run Celery worker (this will block)
    run_celery_worker()
