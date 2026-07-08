"""
matchroom/middleware.py

JWT Authentication kwa WebSocket connections. WebSocket haina Authorization
header rahisi kama HTTP REST — token inatumwa kama query param:
ws://host/ws/match/5/room/?token=<access_token>
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token_str):
    from accounts.models import User

    try:
        validated_token = AccessToken(token_str)
        user_id = validated_token["user_id"]
        return User.objects.get(id=user_id, is_active=True)
    except (TokenError, KeyError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        scope["user"] = await get_user_from_token(token) if token else AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)