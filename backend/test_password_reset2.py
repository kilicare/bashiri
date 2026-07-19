#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from support.models import SupportTicket
from django.test import RequestFactory
from accounts.views import RequestPasswordResetView
import json

print("=== TEST 5: RequestPasswordResetView Privacy Pattern (Detailed) ===")

# Create test user
try:
    user = User.objects.get(phone_number='+255712345678')
    user.delete()
except User.DoesNotExist:
    pass

user = User.objects.create_user(phone_number='+255712345678', password='TestPass123!')
print(f'✓ Test user created: {user.phone_number}')

# Clean up any existing tickets
SupportTicket.objects.filter(user=user, type='ACCOUNT_ISSUE').delete()

factory = RequestFactory()
view = RequestPasswordResetView.as_view()

# Test 1: Valid phone format, existing user
request = factory.post('/api/auth/request-password-reset/',
    json.dumps({'phone_number': '+255712345678', 'message': 'Test message'}),
    content_type='application/json'
)
response1 = view(request)
print(f'Test 1 - Valid phone, existing user:')
print(f'  Status: {response1.status_code}')
print(f'  Detail: {response1.data.get("detail")}')

# Test 2: Valid phone format, non-existing user
request = factory.post('/api/auth/request-password-reset/',
    json.dumps({'phone_number': '+255712345679', 'message': 'Test message'}),
    content_type='application/json'
)
response2 = view(request)
print(f'Test 2 - Valid phone, non-existing user:')
print(f'  Status: {response2.status_code}')
print(f'  Detail: {response2.data.get("detail")}')

# Test 3: Invalid phone format (too short)
request = factory.post('/api/auth/request-password-reset/',
    json.dumps({'phone_number': '123', 'message': 'Test message'}),
    content_type='application/json'
)
response3 = view(request)
print(f'Test 3 - Invalid phone format (too short):')
print(f'  Status: {response3.status_code}')
print(f'  Detail: {response3.data.get("detail")}')

# Test 4: Invalid phone format (wrong format)
request = factory.post('/api/auth/request-password-reset/',
    json.dumps({'phone_number': '0712345678', 'message': 'Test message'}),
    content_type='application/json'
)
response4 = view(request)
print(f'Test 4 - Invalid phone format (missing +255):')
print(f'  Status: {response4.status_code}')
print(f'  Detail: {response4.data.get("detail")}')

# Check ticket counts
ticket_count = SupportTicket.objects.filter(type='ACCOUNT_ISSUE').count()
print(f'\nTotal SupportTickets created: {ticket_count} (expected 1)')

# Cleanup
SupportTicket.objects.filter(user=user, type='ACCOUNT_ISSUE').delete()
user.delete()
print('✓ Test data cleaned up')

print('\n=== PRIVACY PATTERN ANALYSIS ===')
if response1.status_code == response2.status_code == 200:
    print('✓ Valid phone formats return same status (200)')
else:
    print('✗ Valid phone formats return different statuses')
    
if response3.status_code == 400 or response4.status_code == 400:
    print('⚠ INVALID PHONE FORMATS RETURN 400 - THIS REVEALS PHONE FORMAT VALIDATION')
    print('  This allows account enumeration by testing phone number formats.')
