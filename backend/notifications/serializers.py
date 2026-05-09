"""
Serializers for notification endpoints.
"""

from rest_framework import serializers
from .models import Notification, NotificationPreference, NotificationDigest
from users.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for notifications.
    """
    actor = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    message = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'actor', 'recipient', 'notification_type',
            'message', 'is_read', 'is_sent',
            'created_at', 'read_at'
        ]
        read_only_fields = [
            'id', 'actor', 'recipient', 'notification_type',
            'is_sent', 'created_at', 'read_at'
        ]

    def get_message(self, obj):
        """Get human-readable message."""
        return obj.get_message()


class NotificationDetailSerializer(NotificationSerializer):
    """
    Detailed notification serializer with additional metadata.
    """
    content_object = serializers.SerializerMethodField()

    class Meta(NotificationSerializer.Meta):
        fields = NotificationSerializer.Meta.fields + ['content_object']

    def get_content_object(self, obj):
        """Get the related object (post, comment, etc)."""
        if obj.content_object:
            if hasattr(obj.content_object, 'id'):
                return {
                    'type': obj.content_type.model,
                    'id': obj.content_object.id,
                    'url': f'/{obj.content_type.model}/{obj.content_object.id}/'
                }
        return None


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for notification preferences.
    """
    class Meta:
        model = NotificationPreference
        fields = [
            'likes_enabled', 'comments_enabled', 'follows_enabled',
            'mentions_enabled', 'frequency',
            'email_enabled', 'email_frequency'
        ]

    def update(self, instance, validated_data):
        """Update notification preferences."""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class NotificationDigestSerializer(serializers.ModelSerializer):
    """
    Serializer for notification digests.
    """
    notifications = NotificationSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = NotificationDigest
        fields = [
            'id', 'user', 'digest_type', 'notifications',
            'is_sent', 'created_at', 'sent_at'
        ]
        read_only_fields = [
            'id', 'user', 'is_sent', 'created_at', 'sent_at'
        ]


class MarkNotificationAsReadSerializer(serializers.Serializer):
    """
    Serializer for marking notification as read.
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    mark_all = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        """Validate that either notification_ids or mark_all is provided."""
        if not data.get('notification_ids') and not data.get('mark_all'):
            raise serializers.ValidationError(
                "Either notification_ids or mark_all must be provided."
            )
        return data
