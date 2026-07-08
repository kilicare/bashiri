"""
matchroom/consumers.py

MatchRoomConsumer — kila mtumiaji anayeungana na chumba cha mechi fulani
anajiunga na "group" ya Channels. Ujumbe wowote unaotumwa unasambazwa
(broadcast) kwa wote waliopo kwenye group hiyo hiyo (kama room = match_id).
"""
import json
import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .moderation import contains_banned_words

RATE_LIMIT_SECONDS = 3
MAX_MESSAGE_LENGTH = 200


class MatchRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
        self.room_group_name = f"match_{self.match_id}"
        self.last_message_time = 0

        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user = user

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "presence_update", "action": "join", "username": user.username},
        )

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            if hasattr(self, "user") and self.user.is_authenticated:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "presence_update", "action": "leave", "username": self.user.username},
                )

    async def receive(self, text_data):
        if not hasattr(self, "user") or not self.user.is_authenticated:
            return

        now = time.time()
        if now - self.last_message_time < RATE_LIMIT_SECONDS:
            await self.send(text_data=json.dumps({
                "type": "error",
                "detail": "Tafadhali subiri sekunde chache kabla ya kutuma ujumbe mwingine.",
            }))
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        content = (data.get("content") or "").strip()[:MAX_MESSAGE_LENGTH]
        if not content:
            return

        if contains_banned_words(content):
            await self.send(text_data=json.dumps({
                "type": "error",
                "detail": "Ujumbe wako una maneno yasiyoruhusiwa kwenye Bashiri.",
            }))
            return

        self.last_message_time = now
        message = await self._save_message(self.user.id, self.match_id, content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "message": message},
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "message", "message": event["message"]}))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence", "action": event["action"], "username": event["username"],
        }))

    @database_sync_to_async
    def _save_message(self, user_id, match_id, content):
        from accounts.models import User

        from .models import MatchRoomMessage

        user = User.objects.get(id=user_id)
        msg = MatchRoomMessage.objects.create(match_id=match_id, user=user, content=content)
        return {
            "id": msg.id,
            "username": user.username,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }