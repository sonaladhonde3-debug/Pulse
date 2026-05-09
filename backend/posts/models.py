"""
Post models for creating and managing user posts.
"""

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Post(models.Model):
    """
    Model for user posts.
    Stores post content and metadata.
    """
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posts',
        db_index=True
    )
    content = models.TextField(max_length=5000)
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Denormalized counts for faster queries
    likes_count = models.IntegerField(default=0, db_index=True)
    comments_count = models.IntegerField(default=0, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['likes_count']),
        ]
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'

    def __str__(self):
        return f"Post by {self.author.username} - {self.created_at}"

    def increment_likes(self):
        """Increment like count."""
        self.likes_count += 1
        self.save(update_fields=['likes_count'])

    def decrement_likes(self):
        """Decrement like count."""
        if self.likes_count > 0:
            self.likes_count -= 1
            self.save(update_fields=['likes_count'])

    def increment_comments(self):
        """Increment comment count."""
        self.comments_count += 1
        self.save(update_fields=['comments_count'])

    def decrement_comments(self):
        """Decrement comment count."""
        if self.comments_count > 0:
            self.comments_count -= 1
            self.save(update_fields=['comments_count'])


class Feed(models.Model):
    """
    Model for user feeds.
    Stores posts visible to each user (for efficient feed generation).
    Phase 3 feature.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='feed'
    )
    posts = models.ManyToManyField(Post, through='FeedPost')
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Feed'
        verbose_name_plural = 'Feeds'

    def __str__(self):
        return f"Feed for {self.user.username}"


class FeedPost(models.Model):
    """
    Through model for Feed and Post relationship.
    Allows efficient feed queries with pagination.
    """
    feed = models.ForeignKey(Feed, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-added_at']
        unique_together = ('feed', 'post')
        verbose_name = 'Feed Post'
        verbose_name_plural = 'Feed Posts'

    def __str__(self):
        return f"{self.post} in feed for {self.feed.user.username}"
