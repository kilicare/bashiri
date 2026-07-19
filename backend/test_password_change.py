#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from support.models import SupportTicket
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from dashboard.views import AdminResetUserPasswordView
from accounts.views import LoginView
from django.contrib.auth import authenticate
import json

print("=== TEST 7: Password reset actually changes login ability ===")

# Create test user
try:
    user = User.objects.get(phone_number='+255712345678')
    user.delete()
except User.DoesNotExist:
    pass

user = User.objects.create_user(phone_number='+255712345678', password='OldPass123!')
print(f'✓ Test user created with password: OldPass123!')

# Create admin user
try:
    admin = User.objects.get(phone_number='+255999999999')
    admin.delete()
except User.DoesNotExist:
    pass

admin = User.objects.create_superuser(phone_number='+255999999999', password='AdminPass123!')
admin.is_staff = True
admin.save()

factory = RequestFactory()
admin_view = AdminResetUserPasswordView.as_view()
login_view = LoginView.as_view()

# Test 1: Login with OLD password (should work before reset)
request = factory.post('/api/auth/login/',
    json.dumps({'phone_number': '+255712345678', 'password': 'OldPass123!'}),
    content_type='application/json'
)
response = login_view(request)
print(f'Test 1 - Login with OLD password before reset:')
print(f'  Status: {response.status_code} (expected 200)')

# Test 2: Login with NEW password (should fail before reset)
request = factory.post('/api/auth/login/',
    json.dumps({'phone_number': '+255712345678', 'password': 'NewPass456!'}),
    content_type='application/json'
)
response = login_view(request)
print(f'Test 2 - Login with NEW password before reset:')
print(f'  Status: {response.status_code} (expected 401)')

# Test 3: Admin resets password
request = factory.post(f'/api/dashboard/users/{user.id}/reset-password/',
    json.dumps({'new_password': 'NewPass456!'}),
    content_type='application/json'
)
force_authenticate(request, user=admin)
response = admin_view(request, user.id)
print(f'Test 3 - Admin resets password to NewPass456!:')
print(f'  Status: {response.status_code} (expected 200)')

# Test 4: Login with OLD password (should fail after reset)
request = factory.post('/api/auth/login/',
    json.dumps({'phone_number': '+255712345678', 'password': 'OldPass123!'}),
    content_type='application/json'
)
response = login_view(request)
print(f'Test 4 - Login with OLD password after reset:')
print(f'  Status: {response.status_code} (expected 401)')

# Test 5: Login with NEW password (should work after reset)
request = factory.post('/api/auth/login/',
    json.dumps({'phone_number': '+255712345678', 'password': 'NewPass456!'}),
    content_type='application/json'
)
response = login_view(request)
print(f'Test 5 - Login with NEW password after reset:')
print(f'  Status: {response.status_code} (expected 200)')
if response.status_code == 200:
    print(f'  - Has access token: {"access" in response.data}')

# Test 6: Django authenticate() with new password
result = authenticate(request=None, phone_number='+255712345678', password='NewPass456!')
print(f'Test 6 - Django authenticate() with NEW password:')
print(f'  Result: {result is not None} (expected True)')

# Test 7: Django authenticate() with old password
result = authenticate(request=None, phone_number='+255712345678', password='OldPass123!')
print(f'Test 7 - Django authenticate() with OLD password:')
print(f'  Result: {result is None} (expected True)')

# Cleanup
user.delete()
admin.delete()
print('✓ Test data cleaned up')
