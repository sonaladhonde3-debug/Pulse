"""
Celery background tasks for posts.
"""

from celery import shared_task
from django.contrib.auth import get_user_model
from .models import Post, Feed, FeedPost

User = get_user_model()


@shared_task(bind=True, max_retries=3)
def update_follower_feeds(self, post_id):
    """
    Update feeds for all followers when a user creates a post.
    Phase 3 feature - Feed generation.
    """
    try:
        post = Post.objects.get(id=post_id)
        author = post.author
        
        # Get all followers of the post author
        followers = author.followers.all()
        
        # Add post to each follower's feed
        for follow_relation in followers:
            follower_user = follow_relation.follower
            feed, created = Feed.objects.get_or_create(user=follower_user)
            
            # Add post to feed if not already there
            FeedPost.objects.get_or_create(feed=feed, post=post)
        
        return f"Updated feed for {followers.count()} followers"
    
    except Post.DoesNotExist:
        return "Post not found"
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def generate_user_feed(self, user_id):
    """
    Generate/refresh a user's feed based on their following list.
    Phase 3 feature - Feed generation.
    """
    try:
        user = User.objects.get(id=user_id)
        feed, created = Feed.objects.get_or_create(user=user)
        
        # Get all posts from users that this user follows
        following_users = user.following.values_list('following', flat=True)
        posts = Post.objects.filter(author_id__in=following_users).order_by('-created_at')[:100]
        
        # Clear existing feed posts and rebuild
        feed.feedpost_set.all().delete()
        
        for post in posts:
            FeedPost.objects.create(feed=feed, post=post)
        
        return f"Generated feed with {posts.count()} posts"
    
    except User.DoesNotExist:
        return "User not found"
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task
def delete_old_drafts():
    """
    Clean up old draft posts (if implemented in future).
    Phase 9 feature - Maintenance tasks.
    """
    from django.utils import timezone
    from datetime import timedelta
    
    thirty_days_ago = timezone.now() - timedelta(days=30)
    # Add logic here when draft feature is implemented
    return "Draft cleanup completed"
