from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/match/(?P<match_id>\d+)/room/$", consumers.MatchRoomConsumer.as_asgi()),
]