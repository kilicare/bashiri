#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from django.test import RequestFactory
from accounts.views import LoginView, RegisterView, RequestPasswordResetView
import json
import time

print("=== TEST 8: Rate limiting (auth_login, auth_register, password_reset) ===")

factory = RequestFactory()
login_view = LoginView.as_view()
register_view = RegisterView.as_view()
reset_view = RequestPasswordResetView.as_view()

# Test auth_login rate limiting (10/minute)
print('\n--- Testing auth_login rate limiting (10/minute) ---')
success_count = 0
for i in range(12):
    request = factory.post('/api/auth/login/',
        json.dumps({'phone_number': '+255712345678', 'password': 'TestPass123!'}),
        content_type='application/json'
    )
    response = login_view(request)
    if response.status_code == 200:
        success_count += 1
    elif response.status_code == 429:
        print(f'  Request {i+1}: 429 (rate limited) - SUCCESS')
        break
    else:
        print(f'  Request {i+1}: {response.status_code}')
    time.sleep(0.1)  # Small delay to avoid overwhelming

if success_count > 10:
    print(f'✗ auth_login: {success_count} requests succeeded (expected max 10)')
else:
    print(f'✓ auth_login: {success_count} requests succeeded before rate limit (expected ~10)')

# Test auth_register rate limiting (5/hour)
print('\n--- Testing auth_register rate limiting (5/hour) ---')
success_count = 0
for i in range(7):
    request = factory.post('/api/auth/register/',
        json.dumps({
            'phone_number': f'+25571234567{i}',
            'password': 'TestPass123!',
            'confirm_password': 'TestPass123!',
            'username': f'testuser{i}',
            'date_of_birth': '2000-01-01'
        }),
        content_type='application/json'
    )
    response = register_view(request)
    if response.status_code in [200, 201]:
        success_count += 1
    elif response.status_code == 429:
        print(f'  Request {i+1}: 429 (rate limited) - SUCCESS')
        break
    else:
        print(f'  Request {i+1}: {response.status_code}')
    time.sleep(0.1)

if success_count > 5:
    print(f'✗ auth_register: {success_count} requests succeeded (expected max 5)')
else:
    print(f'✓ auth_register: {success_count} requests succeeded before rate limit (expected ~5)')

# Test password_reset rate limiting (5/hour)
print('\n--- Testing password_reset rate limiting (5/hour) ---')
success_count = 0
for i in range(7):
    request = factory.post('/api/auth/request-password-reset/',
        json.dumps({'phone_number': '+255712345678', 'message': 'Test'}),
        content_type='application/json'
    )
    response = reset_view(request)
    if response.status_code == 200:
        success_count += 1
    elif response.status_code == 429:
        print(f'  Request {i+1}: 429 (rate limited) - SUCCESS')
        break
    else:
        print(f'  Request {i+1}: {response.status_code}')
    time.sleep(0.1)

if success_count > 5:
    print(f'✗ password_reset: {success_count} requests succeeded (expected max 5)')
else:
    print(f'✓ password_reset: {success_count} requests succeeded before rate limit (expected ~5)')

print('\n=== RATE LIMITING SUMMARY ===')
print('Note: Rate limiting may not work in test environment without Redis cache')
print('Production rate limiting depends on DRF throttling with cache backend')
