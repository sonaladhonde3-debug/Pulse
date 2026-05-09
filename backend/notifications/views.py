"""
Views for notification management and delivery.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Notification, NotificationPreference, NotificationDigest
from .serializers import (
    NotificationSerializer, NotificationDetailSerializer,
    NotificationPreferenceSerializer, NotificationDigestSerializer,
    MarkNotificationAsReadSerializer
)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing notifications.
    
    GET /api/notifications/ - List user's notifications
    GET /api/notifications/{id}/ - Get notification details
    POST /api/notifications/{id}/mark-as-read/ - Mark as read
    POST /api/notifications/mark-all-as-read/ - Mark all as read
    GET /api/notifications/unread-count/ - Get unread count
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'is_read']
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']

    def get_queryset(self):
        """Get only current user's notifications."""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('actor')

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'retrieve':
            return NotificationDetailSerializer
        return NotificationSerializer

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read for current user."""
        serializer = MarkNotificationAsReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        notifications = self.get_queryset()

        if serializer.validated_data.get('mark_all'):
            # Mark all as read
            count = notifications.filter(is_read=False).update(
                is_read=True
            )
            return Response(
                {'detail': f'Marked {count} notifications as read.'},
                status=status.HTTP_200_OK
            )
        else:
            # Mark specific notifications as read
            notification_ids = serializer.validated_data.get('notification_ids', [])
            count = notifications.filter(
                id__in=notification_ids,
                is_read=False
            ).update(is_read=True)
            return Response(
                {'detail': f'Marked {count} notifications as read.'},
                status=status.HTTP_200_OK
            )

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent notifications (last 20)."""
        notifications = self.get_queryset()[:20]
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        """Delete all notifications for current user."""
        count, _ = self.get_queryset().delete()
        return Response(
            {'detail': f'Deleted {count} notifications.'},
            status=status.HTTP_200_OK
        )


class NotificationPreferenceViewSet(viewsets.ViewSet):
    """
    ViewSet for managing notification preferences.
    
    GET /api/notifications/preferences/ - Get user preferences
    PUT /api/notifications/preferences/ - Update preferences
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get', 'put'])
    def preferences(self, request):
        """Get or update user notification preferences."""
        try:
            preference = request.user.notification_preference
        except NotificationPreference.DoesNotExist:
            preference = NotificationPreference.objects.create(user=request.user)

        if request.method == 'GET':
            serializer = NotificationPreferenceSerializer(preference)
            return Response(serializer.data)

        elif request.method == 'PUT':
            serializer = NotificationPreferenceSerializer(
                preference,
                data=request.data,
                partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationDigestViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for notification digests (Phase 9).
    
    GET /api/notifications/digests/ - List digests
    GET /api/notifications/digests/{id}/ - Get digest details
    """
    serializer_class = NotificationDigestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['digest_type', 'is_sent']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Get only current user's digests."""
        return NotificationDigest.objects.filter(
            user=self.request.user
        ).prefetch_related('notifications')
