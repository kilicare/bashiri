#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from support.models import SupportTicket, SupportMessage
from django.test import RequestFactory
from dashboard.views import AdminResetUserPasswordView
from django.contrib.auth.models import AnonymousUser
import json

print("=== TEST 6: AdminResetUserPasswordView with/without tickets ===")

# Create test user
try:
    user = User.objects.get(phone_number='+255712345678')
    user.delete()
except User.DoesNotExist:
    pass

user = User.objects.create_user(phone_number='+255712345678', password='OldPass123!')
print(f'✓ Test user created: {user.phone_number}')

# Create admin user
try:
    admin = User.objects.get(phone_number='+255999999999')
    admin.delete()
except User.DoesNotExist:
    pass

admin = User.objects.create_superuser(phone_number='+255999999999', password='AdminPass123!')
admin.is_staff = True
admin.save()
print(f'✓ Admin user created: {admin.phone_number}')

# Clean up existing tickets
SupportTicket.objects.filter(user=user, type='ACCOUNT_ISSUE').delete()

factory = RequestFactory()
view = AdminResetUserPasswordView.as_view()

# Test 1: User with open ACCOUNT_ISSUE ticket
ticket = SupportTicket.objects.create(
    user=user,
    guest_phone=user.phone_number,
    type='ACCOUNT_ISSUE',
    subject='Password Reset Request',
    status='OPEN',
)
print(f'✓ Created open ACCOUNT_ISSUE ticket: {ticket.id}')

request = factory.post(f'/api/dashboard/users/{user.id}/reset-password/',
    json.dumps({'new_password': 'NewPass456!'}),
    content_type='application/json'
)
request.user = admin
response1 = view(request, user.id)
print(f'Test 1 - Reset with open ticket:')
print(f'  Status: {response1.status_code}')
print(f'  Detail: {response1.data.get("detail")}')

# Check if ticket was resolved
ticket.refresh_from_db()
print(f'  Ticket status after reset: {ticket.status} (expected RESOLVED)')

# Check if message was added
message_count = SupportMessage.objects.filter(ticket=ticket).count()
print(f'  Messages on ticket: {message_count} (expected 2: original + admin reply)')

# Test 2: User without any ticket
SupportTicket.objects.filter(user=user).delete()
print(f'✓ Removed all tickets for user')

request = factory.post(f'/api/dashboard/users/{user.id}/reset-password/',
    json.dumps({'new_password': 'AnotherPass789!'}),
    content_type='application/json'
)
request.user = admin
response2 = view(request, user.id)
print(f'Test 2 - Reset without any ticket:')
print(f'  Status: {response2.status_code}')
print(f'  Detail: {response2.data.get("detail")}')

# Test 3: Invalid password (too short)
request = factory.post(f'/api/dashboard/users/{user.id}/reset-password/',
    json.dumps({'new_password': 'short'}),
    content_type='application/json'
)
request.user = admin
response3 = view(request, user.id)
print(f'Test 3 - Invalid password (too short):')
print(f'  Status: {response3.status_code} (expected 400)')

# Cleanup
SupportTicket.objects.filter(user=user).delete()
user.delete()
admin.delete()
print('✓ Test data cleaned up')
