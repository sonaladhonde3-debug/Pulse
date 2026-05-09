"""
Models for user interactions (likes and comments).
"""

from django.db import models
from django.contrib.auth import get_user_model
from posts.models import Post

User = get_user_model()


class Like(models.Model):
    """
    Model for post likes.
    Tracks which users have liked which posts.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='likes',
        db_index=True
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='liked_by',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        indexes = [
            models.Index(fields=['user', 'post']),
            models.Index(fields=['post', '-created_at']),
        ]
        verbose_name = 'Like'
        verbose_name_plural = 'Likes'

    def __str__(self):
        return f"{self.user.username} likes {self.post}"

    def save(self, *args, **kwargs):
        """Save like and increment post like count."""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.post.increment_likes()
            
            # Send notification (Phase 5)
            from notifications.tasks import send_like_notification
            send_like_notification.delay(self.user.id, self.post.id)

    def delete(self, *args, **kwargs):
        """Delete like and decrement post like count."""
        post = self.post
        super().delete(*args, **kwargs)
        post.decrement_likes()


class Comment(models.Model):
    """
    Model for post comments.
    Allows users to leave comments on posts.
    """
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments',
        db_index=True
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments',
        db_index=True
    )
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'created_at']),
            models.Index(fields=['author', 'created_at']),
        ]
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post}"

    def save(self, *args, **kwargs):
        """Save comment and increment post comment count."""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.post.increment_comments()
            
            # Send notification (Phase 5)
            from notifications.tasks import send_comment_notification
            send_comment_notification.delay(self.author.id, self.post.id, self.id)

    def delete(self, *args, **kwargs):
        """Delete comment and decrement post comment count."""
        post = self.post
        super().delete(*args, **kwargs)
        post.decrement_comments()

    def increment_likes(self):
        """Increment comment like count."""
        self.likes_count += 1
        self.save(update_fields=['likes_count'])

    def decrement_likes(self):
        """Decrement comment like count."""
        if self.likes_count > 0:
            self.likes_count -= 1
            self.save(update_fields=['likes_count'])


class CommentLike(models.Model):
    """
    Model for liking comments.
    Allows users to like comments on posts.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comment_likes',
        db_index=True
    )
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name='liked_by',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'comment')
        indexes = [
            models.Index(fields=['user', 'comment']),
            models.Index(fields=['comment', '-created_at']),
        ]
        verbose_name = 'Comment Like'
        verbose_name_plural = 'Comment Likes'

    def __str__(self):
        return f"{self.user.username} likes comment {self.comment.id}"

    def save(self, *args, **kwargs):
        """Save comment like and increment comment like count."""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.comment.increment_likes()

    def delete(self, *args, **kwargs):
        """Delete comment like and decrement comment like count."""
        comment = self.comment
        super().delete(*args, **kwargs)
        comment.decrement_likes()
