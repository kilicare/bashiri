#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate
from accounts.models import User

print("=== TEST 1: Django authenticate() with phone_number + password ===")

# Create test user
try:
    user = User.objects.get(phone_number='+255712345678')
    user.delete()
except User.DoesNotExist:
    pass

user = User.objects.create_user(phone_number='+255712345678', password='TestPass123!')
print(f'✓ User created: {user.phone_number}')
print(f'✓ Password hashed: {user.password.startswith("$2b$")}')

# Test correct password
result = authenticate(request=None, phone_number='+255712345678', password='TestPass123!')
if result:
    print(f'✓ Correct password: AUTHENTICATED (user: {result.phone_number})')
else:
    print(f'✗ Correct password: FAILED (should have authenticated)')

# Test wrong password
result = authenticate(request=None, phone_number='+255712345678', password='WrongPass123')
if result is None:
    print(f'✓ Wrong password: REJECTED (correct)')
else:
    print(f'✗ Wrong password: ACCEPTED (should have rejected)')

# Test non-existent phone
result = authenticate(request=None, phone_number='+255999999999', password='AnyPass123')
if result is None:
    print(f'✓ Non-existent phone: REJECTED (correct)')
else:
    print(f'✗ Non-existent phone: ACCEPTED (should have rejected)')

user.delete()
print('✓ Test user cleaned up')
