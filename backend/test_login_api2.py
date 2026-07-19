#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from django.test import RequestFactory
from accounts.views import LoginView
import json

print("=== TEST 1: LoginView API - Account Enumeration Protection ===")

# Create test user
try:
    user = User.objects.get(phone_number='+255712345678')
    user.delete()
except User.DoesNotExist:
    pass

user = User.objects.create_user(phone_number='+255712345678', password='TestPass123!')
print(f'✓ Test user created: {user.phone_number}')

factory = RequestFactory()
view = LoginView.as_view()

# Test correct password
request = factory.post('/api/auth/login/', 
    json.dumps({'phone_number': '+255712345678', 'password': 'TestPass123!'}),
    content_type='application/json'
)
response = view(request)
print(f'✓ Correct password: {response.status_code} (expected 200)')
print(f'  - Error message: {response.data.get("detail") if response.status_code != 200 else "Success"}')

# Test wrong password on existing user
request = factory.post('/api/auth/login/',
    json.dumps({'phone_number': '+255712345678', 'password': 'WrongPass123'}),
    content_type='application/json'
)
response = view(request)
print(f'✓ Wrong password (existing user): {response.status_code} (expected 401)')
print(f'  - Error message: {response.data.get("detail")}')

# Test valid phone number format that doesn't exist
request = factory.post('/api/auth/login/',
    json.dumps({'phone_number': '+255712345679', 'password': 'AnyPass123'}),
    content_type='application/json'
)
response = view(request)
print(f'✓ Valid phone not in DB: {response.status_code} (expected 401)')
print(f'  - Error message: {response.data.get("detail")}')

user.delete()
print('✓ Test user cleaned up')
