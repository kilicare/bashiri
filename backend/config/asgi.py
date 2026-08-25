"""
ASGI config for BASHIRI project.
Inashughulikia HTTP (Django REST) na WebSocket (Match Room live chat)
kwa protocol router moja.
"""
import os

from django.core.asgi import get_asgi_application
from django.conf import settings
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Django app LAZIMA ipakiwe kabla ya kuingiza chochote kinachotumia models
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import AllowedHostsOriginValidator  # noqa: E402

from matchroom.middleware import JWTAuthMiddlewareStack  # noqa: E402
import matchroom.routing  # noqa: E402
from tips.consumers import TipConsumer  # noqa: E402
from django.urls import path  # noqa: E402

# WebSocket URL patterns
tips_websocket_urlpatterns = [
    path('ws/tips/', TipConsumer.as_asgi()),
]

# Wrap Django ASGI app with static files handler for production
if not settings.DEBUG:
    django_asgi_app = ASGIStaticFilesHandler(django_asgi_app)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(
            URLRouter(
                matchroom.routing.websocket_urlpatterns + tips_websocket_urlpatterns
            )
        )
    ),
})
