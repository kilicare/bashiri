"""
accounts/managers.py

Custom manager kwa User model yetu — phone_number ndio USERNAME_FIELD,
sio email wala username ya kawaida ya Django.
"""
from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError("Namba ya simu inahitajika (phone_number).")
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(phone_number, password, **extra_fields)

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser lazima awe na is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser lazima awe na is_superuser=True.")

        return self._create_user(phone_number, password, **extra_fields)
