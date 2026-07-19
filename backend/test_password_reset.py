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

print("=== TEST 5: RequestPasswordResetView Privacy Pattern ===")

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

# Test with existing phone
request = factory.post('/api/auth/request-password-reset/',
    json.dumps({'phone_number': '+255712345678', 'message': 'Test message'}),
    content_type='application/json'
)
response1 = view(request)
print(f'✓ Existing phone: {response1.status_code} (expected 200)')
print(f'  - Response detail: {response1.data.get("detail")}')

# Check if ticket was created
ticket_count1 = SupportTicket.objects.filter(user=user, type='ACCOUNT_ISSUE').count()
print(f'  - SupportTickets created: {ticket_count1} (expected 1)')

# Test with non-existent phone
request = factory.post('/api/auth/request-password-reset/',
    json.dumps({'phone_number': '+255999999999', 'message': 'Test message'}),
    content_type='application/json'
)
response2 = view(request)
print(f'✓ Non-existent phone: {response2.status_code} (expected 200)')
print(f'  - Response detail: {response2.data.get("detail")}')

# Check if ticket was created for non-existent user
ticket_count2 = SupportTicket.objects.filter(type='ACCOUNT_ISSUE').count()
print(f'  - Total SupportTickets after non-existent request: {ticket_count2} (expected 1, no new ticket)')

# Verify responses are identical
if response1.data.get("detail") == response2.data.get("detail"):
    print(f'✓ Responses are IDENTICAL (privacy pattern working)')
else:
    print(f'✗ Responses DIFFER (privacy pattern broken)')

# Cleanup
SupportTicket.objects.filter(user=user, type='ACCOUNT_ISSUE').delete()
user.delete()
print('✓ Test data cleaned up')
