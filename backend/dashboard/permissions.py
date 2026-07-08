"""dashboard/permissions.py"""
from rest_framework.permissions import BasePermission


class IsBashiriAdmin(BasePermission):
    """Ruhusu tu watumiaji wenye is_staff=True (admin za Bashiri)."""

    message = "Huna ruhusa ya kuingia sehemu hii ya Admin."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
