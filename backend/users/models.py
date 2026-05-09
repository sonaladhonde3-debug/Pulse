"""
User models for authentication and profile management.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Includes profile information and follow tracking.
    """
    bio = models.TextField(blank=True, default='', max_length=500)
    profile_picture = models.URLField(blank=True, null=True)
    followers_count = models.IntegerField(default=0, db_index=True)
    following_count = models.IntegerField(default=0, db_index=True)
    posts_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['followers_count']),
        ]
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"@{self.username}"

    def get_follower_count(self):
        """Get accurate follower count from database."""
        return self.followers.count()

    def get_following_count(self):
        """Get accurate following count from database."""
        return self.following.count()


class Follow(models.Model):
    """
    Model to track user follows (relationships).
    Maintains referential integrity and indexing for fast lookups.
    """
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='following',
        db_index=True
    )
    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='followers',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        indexes = [
            models.Index(fields=['follower', '-created_at']),
            models.Index(fields=['following', '-created_at']),
        ]
        verbose_name = 'Follow'
        verbose_name_plural = 'Follows'

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

    def clean(self):
        """Prevent user from following themselves."""
        from django.core.exceptions import ValidationError
        if self.follower == self.following:
            raise ValidationError("Users cannot follow themselves.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        # Update follower/following counts
        self._update_counts()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        # Update follower/following counts
        self._update_counts_delete()

    def _update_counts(self):
        """Update follower and following counts."""
        self.follower.following_count = self.follower.following.count()
        self.follower.save(update_fields=['following_count'])
        
        self.following.followers_count = self.following.followers.count()
        self.following.save(update_fields=['followers_count'])

    def _update_counts_delete(self):
        """Update counts after deletion."""
        self.follower.following_count = self.follower.following.count()
        self.follower.save(update_fields=['following_count'])
        
        self.following.followers_count = self.following.followers.count()
        self.following.save(update_fields=['followers_count'])


class UserSettings(models.Model):
    """
    User notification preferences and settings.
    Phase 8 feature for customizable notifications.
    """
    NOTIFICATION_FREQUENCY_CHOICES = [
        ('instant', 'Instant'),
        ('daily_digest', 'Daily Digest'),
        ('weekly_digest', 'Weekly Digest'),
        ('disabled', 'Disabled'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    
    # Notification preferences
    notify_on_like = models.BooleanField(default=True)
    notify_on_comment = models.BooleanField(default=True)
    notify_on_follow = models.BooleanField(default=True)
    notify_on_mention = models.BooleanField(default=True)
    
    # Notification frequency
    notification_frequency = models.CharField(
        max_length=20,
        choices=NOTIFICATION_FREQUENCY_CHOICES,
        default='instant'
    )
    
    # Email notifications
    email_notifications_enabled = models.BooleanField(default=True)
    email_on_like = models.BooleanField(default=False)
    email_on_comment = models.BooleanField(default=False)
    email_on_follow = models.BooleanField(default=False)
    
    # Privacy
    private_account = models.BooleanField(default=False)
    allow_messages = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User Settings'
        verbose_name_plural = 'User Settings'

    def __str__(self):
        return f"Settings for {self.user.username}"


# Signal handlers for automatic settings creation
@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    """Create UserSettings when a new User is created."""
    if created:
        UserSettings.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_settings(sender, instance, **kwargs):
    """Save UserSettings when User is saved."""
    try:
        instance.settings.save()
    except UserSettings.DoesNotExist:
        UserSettings.objects.create(user=instance)
