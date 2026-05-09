"""
Django Channels WebSocket consumers for real-time notifications.
Phase 7 feature - Real-time notification delivery via WebSocket.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import Token
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import Notification
from .serializers import NotificationSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    
    Connection URL: ws://localhost:8000/ws/notifications/
    
    Features:
    - Real-time notification delivery
    - Automatic connection management
    - User authentication via JWT
    - Notification acknowledgment
    """

    async def connect(self):
        """Handle WebSocket connection."""
        try:
            # Get user from JWT token in URL
            self.user = await self.get_user_from_token()
            
            if not self.user:
                await self.close()
                return
            
            # Create room name for this user
            self.room_name = f"notifications_{self.user.id}"
            self.room_group_name = f"notifications_{self.user.id}"
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            logger.info(f"WebSocket connection opened for user {self.user.username}")
            
            # Send connection confirmation
            await self.send(json.dumps({
                'type': 'connection_established',
                'message': 'Connected to notification stream',
                'user_id': self.user.id,
            }))
        
        except Exception as e:
            logger.error(f"Error in WebSocket connect: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket connection closed for user {self.user.username}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_as_read':
                await self.handle_mark_as_read(data)
            elif message_type == 'get_unread_count':
                await self.handle_get_unread_count(data)
            elif message_type == 'ping':
                await self.send(json.dumps({'type': 'pong'}))
            else:
                logger.warning(f"Unknown message type: {message_type}")
        
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await self.send(json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def notification_event(self, event):
        """
        Receive notification event from group and send to WebSocket.
        This is called by channel_layer.group_send()
        """
        notification_data = event['notification']
        
        await self.send(json.dumps({
            'type': 'notification',
            'data': notification_data
        }))

    async def handle_mark_as_read(self, data):
        """Handle marking notification as read."""
        notification_id = data.get('notification_id')
        
        try:
            notification = await self.mark_notification_as_read(
                notification_id,
                self.user
            )
            
            await self.send(json.dumps({
                'type': 'marked_as_read',
                'notification_id': notification_id,
                'success': True
            }))
        
        except Exception as e:
            await self.send(json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def handle_get_unread_count(self, data):
        """Handle getting unread notification count."""
        try:
            count = await self.get_unread_count(self.user)
            
            await self.send(json.dumps({
                'type': 'unread_count',
                'count': count
            }))
        
        except Exception as e:
            await self.send(json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    # Database sync methods

    @database_sync_to_async
    def get_user_from_token(self):
        """Extract user from JWT token in URL."""
        try:
            # Get token from query string
            query_string = self.scope.get('query_string', b'').decode('utf-8')
            
            # Parse token from query params
            # Expected format: ?token=<jwt_token>
            if 'token=' in query_string:
                token_str = query_string.split('token=')[1].split('&')[0]
                
                from rest_framework_simplejwt.authentication import JWTAuthentication
                from rest_framework_simplejwt.tokens import AccessToken
                
                token = AccessToken(token_str)
                user_id = token.payload.get('user_id')
                
                if user_id:
                    return User.objects.get(id=user_id)
            
            return None
        
        except Exception as e:
            logger.error(f"Error extracting user from token: {str(e)}")
            return None

    @database_sync_to_async
    def mark_notification_as_read(self, notification_id, user):
        """Mark a notification as read."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=user
            )
            notification.mark_as_read()
            return notification
        except Notification.DoesNotExist:
            raise Exception("Notification not found")

    @database_sync_to_async
    def get_unread_count(self, user):
        """Get count of unread notifications."""
        return Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()


class NotificationBroadcaster:
    """
    Helper class to broadcast notifications to connected users.
    Use this to send notifications from anywhere in the app.
    """

    @staticmethod
    async def broadcast_to_user(user_id, notification_data):
        """
        Broadcast notification to a specific user's WebSocket.
        
        Usage:
            from channels.layers import get_channel_layer
            from .consumers import NotificationBroadcaster
            
            channel_layer = get_channel_layer()
            await NotificationBroadcaster.broadcast_to_user(user_id, notification_data)
        """
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        room_group_name = f"notifications_{user_id}"
        
        await channel_layer.group_send(
            room_group_name,
            {
                'type': 'notification_event',
                'notification': notification_data,
            }
        )

    @staticmethod
    def broadcast_to_user_sync(user_id, notification_id):
        """
        Synchronous wrapper for broadcasting notifications.
        Call from views or signals.
        """
        import asyncio
        from asgiref.sync import async_to_sync
        
        try:
            notification = Notification.objects.get(id=notification_id)
            serializer = NotificationSerializer(notification)
            
            async_to_sync(NotificationBroadcaster.broadcast_to_user)(
                user_id,
                serializer.data
            )
        except Notification.DoesNotExist:
            logger.error(f"Notification {notification_id} not found")
