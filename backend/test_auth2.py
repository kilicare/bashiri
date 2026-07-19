#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate
from accounts.models import User
from django.conf import settings

print("=== PASSWORD HASHING CHECK ===")
print(f"Password hashers: {settings.PASSWORD_HASHERS}")

# Create test user
try:
    user = User.objects.get(phone_number='+255712345678')
    user.delete()
except User.DoesNotExist:
    pass

user = User.objects.create_user(phone_number='+255712345678', password='TestPass123!')
print(f'Password hash: {user.password[:50]}...')
print(f'Password starts with algorithm: {user.password.split("$")[0] if "$" in user.password else "NO $ SEPARATOR"}')

# Test correct password
result = authenticate(request=None, phone_number='+255712345678', password='TestPass123!')
print(f'Correct password auth: {"SUCCESS" if result else "FAILED"}')

# Test wrong password
result = authenticate(request=None, phone_number='+255712345678', password='WrongPass123')
print(f'Wrong password auth: {"SUCCESS" if result else "FAILED (correct)"}')

user.delete()
