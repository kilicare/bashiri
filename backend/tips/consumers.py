import json
import logging
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from .models import UserTip, TipPerformance, TipVote
from .serializers import UserTipSerializer

logger = logging.getLogger(__name__)


async def retry_redis_operation(operation, max_retries=3, delay=1):
    """Retry Redis operations with exponential backoff"""
    for attempt in range(max_retries):
        try:
            return await operation()
        except Exception as e:
            if "timeout" in str(e).lower() and attempt < max_retries - 1:
                await asyncio.sleep(delay * (2 ** attempt))
                continue
            raise


class TipConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time tip updates
    Handles: tip verification, voting, comments, leaderboard updates
    """

    async def connect(self):
        """Handle WebSocket connection"""
        try:
            self.user = self.scope['user']
            self.room_name = 'tips_global'
            self.room_group_name = f'tips_{self.room_name}'

            # Join room group with retry
            await retry_redis_operation(lambda: self.channel_layer.group_add(
                self.room_group_name, self.channel_name
            ))
            await self.accept()

            logger.info(f"User {self.user.username} connected to tips channel")
        except Exception as e:
            logger.error(f"WebSocket connect failed for tips: {str(e)}", exc_info=True)
            try:
                await self.close(code=1011)
            except:
                pass

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            await retry_redis_operation(lambda: self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            ))
            logger.info(f"User {self.user.username} disconnected from tips channel")
        except Exception as e:
            logger.error(f"WebSocket disconnect error for tips: {str(e)}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'subscribe_tip':
                await self.subscribe_tip(data)
            elif action == 'unsubscribe_tip':
                await self.unsubscribe_tip(data)
            elif action == 'subscribe_leaderboard':
                await self.subscribe_leaderboard()
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Unknown action'
                }))

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            logger.error(f"Error in TipConsumer.receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Server error'
            }))

    # ============================================
    # MESSAGE HANDLERS
    # ============================================

    async def subscribe_tip(self, data):
        """Subscribe to specific tip updates"""
        tip_id = data.get('tip_id')
        if not tip_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Tip ID required'
            }))
            return

        # Verify tip exists
        tip_exists = await self.tip_exists(tip_id)
        if not tip_exists:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Tip not found'
            }))
            return

        # Add to tip-specific group with retry
        room_group = f'tip_{tip_id}'
        try:
            await retry_redis_operation(lambda: self.channel_layer.group_add(room_group, self.channel_name))
        except Exception as e:
            logger.error(f"Failed to subscribe to tip {tip_id}: {str(e)}")
            return

        await self.send(text_data=json.dumps({
            'type': 'subscription_confirmed',
            'tip_id': tip_id
        }))

    async def unsubscribe_tip(self, data):
        """Unsubscribe from specific tip updates"""
        tip_id = data.get('tip_id')
        if tip_id:
            room_group = f'tip_{tip_id}'
            try:
                await retry_redis_operation(lambda: self.channel_layer.group_discard(room_group, self.channel_name))
            except Exception as e:
                logger.error(f"Failed to unsubscribe from tip {tip_id}: {str(e)}")

        await self.send(text_data=json.dumps({
            'type': 'unsubscription_confirmed',
            'tip_id': tip_id
        }))

    async def subscribe_leaderboard(self):
        """Subscribe to leaderboard updates"""
        leaderboard_group = 'leaderboard_updates'
        try:
            await retry_redis_operation(lambda: self.channel_layer.group_add(
                leaderboard_group, self.channel_name
            ))
        except Exception as e:
            logger.error(f"Failed to subscribe to leaderboard: {str(e)}")
            return

        await self.send(text_data=json.dumps({
            'type': 'leaderboard_subscription_confirmed'
        }))

    # ============================================
    # BROADCAST HANDLERS (called from Django)
    # ============================================

    async def tip_verified(self, event):
        """Broadcast when tip is verified"""
        await self.send(text_data=json.dumps({
            'type': 'tip_verified',
            'tip_id': event['tip_id'],
            'status': event['status'],
            'is_correct': event['is_correct'],
        }))

    async def tip_voted(self, event):
        """Broadcast when tip is voted"""
        await self.send(text_data=json.dumps({
            'type': 'tip_voted',
            'tip_id': event['tip_id'],
            'upvotes': event['upvotes_count'],
            'downvotes': event['downvotes_count'],
        }))

    async def leaderboard_updated(self, event):
        """Broadcast leaderboard updates"""
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_updated',
            'data': event['data'],
        }))

    # ============================================
    # HELPER METHODS
    # ============================================

    @database_sync_to_async
    def tip_exists(self, tip_id):
        """Check if tip exists"""
        return UserTip.objects.filter(pk=tip_id).exists()


# ============================================
# BROADCAST FUNCTIONS (Call from Django views/tasks)
# ============================================

async def broadcast_tip_verified(tip_id, status, is_correct):
    """Broadcast tip verification to all connected clients"""
    from channels.layers import get_channel_layer

    try:
        channel_layer = get_channel_layer()
        room_group = f'tip_{tip_id}'

        await retry_redis_operation(lambda: channel_layer.group_send(room_group, {
            'type': 'tip_verified',
            'tip_id': tip_id,
            'status': status,
            'is_correct': is_correct,
        }))
    except Exception as e:
        logger.error(f"Failed to broadcast tip verification for {tip_id}: {str(e)}")


async def broadcast_tip_voted(tip_id, upvotes_count, downvotes_count):
    """Broadcast tip vote updates"""
    from channels.layers import get_channel_layer

    try:
        channel_layer = get_channel_layer()
        room_group = f'tip_{tip_id}'

        await retry_redis_operation(lambda: channel_layer.group_send(room_group, {
            'type': 'tip_voted',
            'tip_id': tip_id,
            'upvotes_count': upvotes_count,
            'downvotes_count': downvotes_count,
        }))
    except Exception as e:
        logger.error(f"Failed to broadcast tip vote for {tip_id}: {str(e)}")


async def broadcast_leaderboard_update(leaderboard_data):
    """Broadcast leaderboard updates"""
    from channels.layers import get_channel_layer

    try:
        channel_layer = get_channel_layer()

        await retry_redis_operation(lambda: channel_layer.group_send('leaderboard_updates', {
            'type': 'leaderboard_updated',
            'data': leaderboard_data,
        }))
    except Exception as e:
        logger.error(f"Failed to broadcast leaderboard update: {str(e)}")
