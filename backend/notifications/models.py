"""
Models for notification system.
Handles real-time and async notifications with WebSocket support.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

User = get_user_model()


class Notification(models.Model):
    """
    Model for user notifications.
    Stores notification events for real-time and digest delivery.
    
    Supports:
    - Real-time WebSocket delivery (Phase 7)
    - Email digests (Phase 9)
    - Notification preferences (Phase 8)
    """
    
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('follow', 'Follow'),
        ('mention', 'Mention'),
        ('system', 'System'),
    ]

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='actions',
        null=True,
        blank=True,
        db_index=True
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        db_index=True
    )
    
    # Generic relation to handle different content types
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Notification state
    is_read = models.BooleanField(default=False, db_index=True)
    is_sent = models.BooleanField(default=False)  # Whether WebSocket was sent
    is_emailed = models.BooleanField(default=False)  # Whether email was sent
    
    # Message for system notifications
    message = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"Notification for {self.recipient} - {self.notification_type}"

    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def get_message(self):
        """Get human-readable notification message."""
        if self.notification_type == 'like':
            return f"{self.actor.username} liked your post"
        elif self.notification_type == 'comment':
            return f"{self.actor.username} commented on your post"
        elif self.notification_type == 'follow':
            return f"{self.actor.username} started following you"
        elif self.notification_type == 'mention':
            return f"{self.actor.username} mentioned you"
        elif self.notification_type == 'system':
            return self.message
        return "New notification"


class NotificationPreference(models.Model):
    """
    Model for storing user notification delivery preferences.
    Phase 8 feature - User can customize how they receive notifications.
    """
    FREQUENCY_CHOICES = [
        ('instant', 'Instant (Real-time WebSocket)'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
        ('disabled', 'Disabled'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preference'
    )
    
    # Type preferences
    likes_enabled = models.BooleanField(default=True)
    comments_enabled = models.BooleanField(default=True)
    follows_enabled = models.BooleanField(default=True)
    mentions_enabled = models.BooleanField(default=True)
    
    # Delivery preferences
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='instant'
    )
    
    # Email preferences
    email_enabled = models.BooleanField(default=False)
    email_frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='daily'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'

    def __str__(self):
        return f"Notification preferences for {self.user.username}"


class NotificationDigest(models.Model):
    """
    Model for storing notification digests.
    Phase 9 feature - Email notifications.
    """
    DIGEST_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notification_digests'
    )
    digest_type = models.CharField(max_length=20, choices=DIGEST_TYPES)
    notifications = models.ManyToManyField(Notification)
    
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification Digest'
        verbose_name_plural = 'Notification Digests'

    def __str__(self):
        return f"{self.digest_type.capitalize()} digest for {self.user.username}"
