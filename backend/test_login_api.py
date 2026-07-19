#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from django.test import RequestFactory
from accounts.views import LoginView
import json

print("=== TEST 1: LoginView API with correct/incorrect passwords ===")

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
if response.status_code == 200:
    data = response.data
    print(f'  - Has access token: {"access" in data}')
    print(f'  - Has refresh token: {"refresh" in data}')

# Test wrong password
request = factory.post('/api/auth/login/',
    json.dumps({'phone_number': '+255712345678', 'password': 'WrongPass123'}),
    content_type='application/json'
)
response = view(request)
print(f'✓ Wrong password: {response.status_code} (expected 401)')
if response.status_code == 401:
    print(f'  - Error message: {response.data.get("detail")}')

# Test non-existent phone
request = factory.post('/api/auth/login/',
    json.dumps({'phone_number': '+255999999999', 'password': 'AnyPass123'}),
    content_type='application/json'
)
response = view(request)
print(f'✓ Non-existent phone: {response.status_code} (expected 401)')
if response.status_code == 401:
    print(f'  - Error message: {response.data.get("detail")}')

user.delete()
print('✓ Test user cleaned up')
