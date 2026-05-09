"""
Celery background tasks for notifications.
Handles async notification creation and delivery.
"""

from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from datetime import timedelta
import logging

from .models import Notification, NotificationPreference, NotificationDigest
from posts.models import Post
from interactions.models import Comment

User = get_user_model()
logger = logging.getLogger(__name__)


# Phase 5: Basic notification tasks

@shared_task(bind=True, max_retries=3)
def send_like_notification(self, user_id, post_id):
    """
    Create notification when a user likes a post.
    Phase 5 feature.
    """
    try:
        user = User.objects.get(id=user_id)
        post = Post.objects.get(id=post_id)
        
        # Don't notify if user liked their own post
        if post.author == user:
            return "User cannot like their own posts"
        
        # Create notification
        notification = Notification.objects.create(
            recipient=post.author,
            actor=user,
            notification_type='like',
            object_id=post.id,
        )
        
        # Send WebSocket notification (Phase 7)
        from .consumers import send_notification_to_user
        send_notification_to_user.delay(notification.id)
        
        logger.info(f"Like notification created for {post.author.username}")
        return "Like notification created"
    
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return "User not found"
    except Post.DoesNotExist:
        logger.error(f"Post {post_id} not found")
        return "Post not found"
    except Exception as exc:
        logger.error(f"Error creating like notification: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_comment_notification(self, user_id, post_id, comment_id):
    """
    Create notification when a user comments on a post.
    Phase 5 feature.
    """
    try:
        user = User.objects.get(id=user_id)
        post = Post.objects.get(id=post_id)
        comment = Comment.objects.get(id=comment_id)
        
        # Don't notify if user commented on their own post
        if post.author == user:
            return "User cannot comment on their own posts"
        
        # Create notification
        notification = Notification.objects.create(
            recipient=post.author,
            actor=user,
            notification_type='comment',
            object_id=comment.id,
        )
        
        # Send WebSocket notification (Phase 7)
        from .consumers import send_notification_to_user
        send_notification_to_user.delay(notification.id)
        
        logger.info(f"Comment notification created for {post.author.username}")
        return "Comment notification created"
    
    except (User.DoesNotExist, Post.DoesNotExist, Comment.DoesNotExist) as e:
        logger.error(f"Object not found in comment notification: {str(e)}")
        return "Object not found"
    except Exception as exc:
        logger.error(f"Error creating comment notification: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_follow_notification(self, follower_id, following_id):
    """
    Create notification when a user is followed.
    Phase 5 feature.
    """
    try:
        follower = User.objects.get(id=follower_id)
        following = User.objects.get(id=following_id)
        
        # Create notification
        notification = Notification.objects.create(
            recipient=following,
            actor=follower,
            notification_type='follow',
        )
        
        # Send WebSocket notification (Phase 7)
        from .consumers import send_notification_to_user
        send_notification_to_user.delay(notification.id)
        
        logger.info(f"Follow notification created for {following.username}")
        return "Follow notification created"
    
    except User.DoesNotExist:
        logger.error(f"User not found in follow notification")
        return "User not found"
    except Exception as exc:
        logger.error(f"Error creating follow notification: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


# Phase 7: WebSocket notification delivery

@shared_task
def send_notification_to_user(notification_id):
    """
    Send WebSocket notification to connected user.
    Phase 7 feature.
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        
        # This is handled by Django Channels consumer
        # The actual WebSocket delivery happens in consumers.py
        notification.is_sent = True
        notification.sent_at = timezone.now()
        notification.save(update_fields=['is_sent', 'sent_at'])
        
        logger.info(f"WebSocket notification sent for {notification.recipient.username}")
        return "WebSocket notification sent"
    
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return "Notification not found"
    except Exception as exc:
        logger.error(f"Error sending WebSocket notification: {str(exc)}")
        raise Exception(f"Error: {str(exc)}")


# Phase 9: Email notifications

@shared_task(bind=True, max_retries=3)
def send_notification_email(self, notification_id):
    """
    Send email notification for a single event.
    Phase 9 feature.
    """
    try:
        notification = Notification.objects.select_related(
            'recipient', 'actor'
        ).get(id=notification_id)
        
        # Check if recipient wants email notifications
        try:
            pref = notification.recipient.notification_preference
            if not pref.email_enabled:
                return "Email notifications disabled for user"
        except NotificationPreference.DoesNotExist:
            return "User has no notification preferences"
        
        # Send email
        subject = f"New notification: {notification.get_message()}"
        context = {
            'user': notification.recipient,
            'notification': notification,
            'actor': notification.actor,
        }
        
        # You would render an email template here
        message = notification.get_message()
        
        send_mail(
            subject,
            message,
            'noreply@socialmedia.com',
            [notification.recipient.email],
            fail_silently=True,
        )
        
        notification.is_emailed = True
        notification.save(update_fields=['is_emailed'])
        
        logger.info(f"Email sent to {notification.recipient.email}")
        return "Email sent"
    
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return "Notification not found"
    except Exception as exc:
        logger.error(f"Error sending email: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task
def generate_daily_digest():
    """
    Generate and send daily notification digests.
    Phase 9 feature.
    """
    try:
        users = User.objects.filter(
            notification_preference__email_enabled=True,
            notification_preference__email_frequency='daily'
        )
        
        count = 0
        for user in users:
            # Get undigested notifications from last 24 hours
            notifications = Notification.objects.filter(
                recipient=user,
                is_emailed=False,
                created_at__gte=timezone.now() - timedelta(hours=24)
            )
            
            if notifications.exists():
                # Create digest
                digest = NotificationDigest.objects.create(
                    user=user,
                    digest_type='daily'
                )
                digest.notifications.set(notifications)
                
                # Send email
                send_digest_email.delay(digest.id)
                count += 1
        
        logger.info(f"Generated {count} daily digests")
        return f"Generated {count} daily digests"
    
    except Exception as exc:
        logger.error(f"Error generating daily digest: {str(exc)}")
        raise Exception(f"Error: {str(exc)}")


@shared_task(bind=True, max_retries=3)
def send_digest_email(self, digest_id):
    """
    Send digest email to user.
    Phase 9 feature.
    """
    try:
        digest = NotificationDigest.objects.select_related('user').get(
            id=digest_id
        )
        
        notifications = digest.notifications.all()
        
        if not notifications.exists():
            return "Digest has no notifications"
        
        # Build email content
        subject = f"Your {digest.get_digest_type_display()} notification digest"
        
        context = {
            'user': digest.user,
            'digest': digest,
            'notifications': notifications,
        }
        
        send_mail(
            subject,
            f"You have {notifications.count()} new notifications",
            'noreply@socialmedia.com',
            [digest.user.email],
            fail_silently=True,
        )
        
        digest.is_sent = True
        digest.sent_at = timezone.now()
        digest.save(update_fields=['is_sent', 'sent_at'])
        
        # Mark notifications as emailed
        notifications.update(is_emailed=True)
        
        logger.info(f"Digest email sent to {digest.user.email}")
        return "Digest email sent"
    
    except NotificationDigest.DoesNotExist:
        logger.error(f"Digest {digest_id} not found")
        return "Digest not found"
    except Exception as exc:
        logger.error(f"Error sending digest email: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


# Maintenance tasks

@shared_task
def cleanup_old_notifications():
    """
    Delete notifications older than 90 days.
    Phase 9 feature - Maintenance.
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=90)
        count, _ = Notification.objects.filter(
            created_at__lt=cutoff_date
        ).delete()
        
        logger.info(f"Deleted {count} old notifications")
        return f"Deleted {count} old notifications"
    
    except Exception as exc:
        logger.error(f"Error cleaning up notifications: {str(exc)}")
        raise Exception(f"Error: {str(exc)}")


@shared_task
def generate_weekly_digest():
    """
    Generate and send weekly notification digests.
    Phase 9 feature.
    """
    try:
        users = User.objects.filter(
            notification_preference__email_enabled=True,
            notification_preference__email_frequency='weekly'
        )
        
        count = 0
        for user in users:
            # Get undigested notifications from last 7 days
            notifications = Notification.objects.filter(
                recipient=user,
                is_emailed=False,
                created_at__gte=timezone.now() - timedelta(days=7)
            )
            
            if notifications.exists():
                # Create digest
                digest = NotificationDigest.objects.create(
                    user=user,
                    digest_type='weekly'
                )
                digest.notifications.set(notifications)
                
                # Send email
                send_digest_email.delay(digest.id)
                count += 1
        
        logger.info(f"Generated {count} weekly digests")
        return f"Generated {count} weekly digests"
    
    except Exception as exc:
        logger.error(f"Error generating weekly digest: {str(exc)}")
        raise Exception(f"Error: {str(exc)}")
