"""
accounts/serializers.py

MUHIMU: Register na Login sasa zinatumia phone_number + password
(badala ya OTP). RequestOTPSerializer/VerifyOTPSerializer zimewekwa
chini kama COMMENT (angalia sehemu ya mwisho ya faili hii).
"""
from datetime import date

import phonenumbers
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User


def normalize_tz_phone(raw_phone: str) -> str:
    try:
        parsed = phonenumbers.parse(raw_phone, "TZ")
    except phonenumbers.NumberParseException:
        raise serializers.ValidationError("Namba ya simu si sahihi.")

    if not phonenumbers.is_valid_number(parsed):
        raise serializers.ValidationError("Namba ya simu si sahihi.")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def _validate_age(dob: date):
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    min_age = settings.BASHIRI["MIN_AGE_YEARS"]
    if age < min_age:
        raise serializers.ValidationError(f"Lazima uwe na miaka {min_age}+ kutumia Bashiri.")
    if dob > today:
        raise serializers.ValidationError("Tarehe ya kuzaliwa si sahihi.")


# ============================================================
# REGISTER / LOGIN (Password-Based) — ACTIVE
# ============================================================
class RegisterSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=4)
    confirm_password = serializers.CharField(write_only=True, min_length=4)
    username = serializers.CharField(max_length=30, min_length=3)
    date_of_birth = serializers.DateField()

    def validate_phone_number(self, value):
        normalized = normalize_tz_phone(value)
        if User.objects.filter(phone_number=normalized).exists():
            raise serializers.ValidationError("Namba hii tayari ina akaunti. Jaribu kuingia badala yake.")
        return normalized

    def validate_username(self, value):
        value = value.strip().lower()
        if not value.replace("_", "").isalnum():
            raise serializers.ValidationError("Username inaruhusu herufi, namba, na underscore (_) pekee.")
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username hii tayari inatumika.")
        return value

    def validate_date_of_birth(self, value):
        _validate_age(value)
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Password hazifanani."})
        return attrs


class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)

    def validate_phone_number(self, value):
        return normalize_tz_phone(value)


class RequestPasswordResetSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    message = serializers.CharField(required=False, allow_blank=True, max_length=300)

    def validate_phone_number(self, value):
        return normalize_tz_phone(value)


# ============================================================
# COMPLETE PROFILE — ACTIVE (imebaki kwa matumizi ya baadaye ya
# "edit profile" — SI sehemu ya OTP flow, ni independent)
# ============================================================
class CompleteProfileSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=30, min_length=3)
    date_of_birth = serializers.DateField()

    def validate_username(self, value):
        value = value.strip().lower()
        if not value.replace("_", "").isalnum():
            raise serializers.ValidationError(
                "Username inaruhusu herufi, namba, na underscore (_) pekee."
            )
        qs = User.objects.filter(username__iexact=value)
        request_user = self.context["request"].user
        if request_user and request_user.is_authenticated:
            qs = qs.exclude(pk=request_user.pk)
        if qs.exists():
            raise serializers.ValidationError("Username hii tayari inatumika.")
        return value

    def validate_date_of_birth(self, value):
        _validate_age(value)
        return value


class UserSerializer(serializers.ModelSerializer):
    accuracy_percentage = serializers.ReadOnlyField()
    profile_complete = serializers.ReadOnlyField()
    is_subscription_active = serializers.ReadOnlyField()
    favorite_team_ids = serializers.PrimaryKeyRelatedField(source="favorite_teams", many=True, read_only=True)
    favorite_league_ids = serializers.PrimaryKeyRelatedField(source="favorite_leagues", many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "phone_number", "username", "date_of_birth", "avatar_url",
            "is_subscriber", "is_subscription_active", "subscription_expires_at",
            "current_streak", "best_streak", "total_predictions",
            "correct_predictions", "accuracy_percentage", "profile_complete",
            "preferred_language", "favorite_team_ids", "favorite_league_ids",
            "date_joined",
        ]
        read_only_fields = fields


class UpdateAvatarSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        # Validate file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Picha isiyozidi 5MB inaruhusiwa.")
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Aina ya picha inaruhusiwa: JPEG, PNG, au WebP.")
        
        return value


class OnboardingSerializer(serializers.Serializer):
    favorite_leagues = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        help_text="List of league IDs (e.g., [1, 2, 3])"
    )
    favorite_teams = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True,
        required=False,
        help_text="List of team IDs (optional, e.g., [10, 23])"
    )

    def validate_favorite_leagues(self, value):
        from predictions.models import League

        # Validate that all league IDs exist
        valid_ids = set(League.objects.filter(id__in=value).values_list('id', flat=True))
        invalid_ids = set(value) - valid_ids

        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid league IDs: {', '.join(map(str, invalid_ids))}"
            )

        return value

    def validate_favorite_teams(self, value):
        from predictions.models import Team

        valid_ids = set(Team.objects.filter(id__in=value).values_list('id', flat=True))
        invalid_ids = set(value) - valid_ids

        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid team IDs: {', '.join(map(str, invalid_ids))}"
            )

        return value


# ============================================================
# OTP FLOW — IMESIMAMISHWA (commented out, si kufutwa)
# ============================================================
"""
class RequestOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)

    def validate_phone_number(self, value):
        return normalize_tz_phone(value)


class VerifyOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    code = serializers.CharField(max_length=6, min_length=4)

    def validate_phone_number(self, value):
        return normalize_tz_phone(value)
"""