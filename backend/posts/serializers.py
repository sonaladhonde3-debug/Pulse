"""
Serializers for post-related endpoints.
"""

from rest_framework import serializers
from .models import Post, Feed, FeedPost
from users.serializers import UserSerializer


class PostSerializer(serializers.ModelSerializer):
    """
    Basic post serializer for listing and detail views.
    """
    author = UserSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_author = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'content', 'image_url',
            'likes_count', 'comments_count',
            'is_liked', 'is_author',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'likes_count', 'comments_count', 'created_at', 'updated_at']

    def get_is_liked(self, obj):
        """Check if current user has liked this post."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from interactions.models import Like
            return Like.objects.filter(
                user=request.user,
                post=obj
            ).exists()
        return False

    def get_is_author(self, obj):
        """Check if current user is the post author."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False


class PostDetailSerializer(PostSerializer):
    """
    Detailed post serializer including comments.
    """
    comments = serializers.SerializerMethodField()

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['comments']

    def get_comments(self, obj):
        """Get recent comments on post."""
        from interactions.serializers import CommentSerializer
        comments = obj.comments.all()[:10]
        return CommentSerializer(comments, many=True, context=self.context).data


class CreatePostSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new posts.
    """
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Post
        fields = ['content', 'image_url', 'author']

    def validate_content(self, value):
        """Validate post content is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Post content cannot be empty.")
        if len(value) > 5000:
            raise serializers.ValidationError("Post content cannot exceed 5000 characters.")
        return value

    def create(self, validated_data):
        """Create new post and update feed."""
        post = Post.objects.create(**validated_data)
        
        # Update feeds for followers (Phase 3 - Feed generation)
        from .tasks import update_follower_feeds
        update_follower_feeds.delay(post.id)
        
        return post


class FeedPostSerializer(serializers.ModelSerializer):
    """
    Serializer for feed posts with pagination support.
    """
    post = PostSerializer()

    class Meta:
        model = FeedPost
        fields = ['post', 'added_at']
        read_only_fields = ['added_at']


class FeedSerializer(serializers.ModelSerializer):
    """
    Serializer for user feeds.
    """
    posts = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)

    class Meta:
        model = Feed
        fields = ['user', 'posts', 'last_updated']
        read_only_fields = ['last_updated']

    def get_posts(self, obj):
        """Get paginated posts from feed."""
        request = self.context.get('request')
        page = request.query_params.get('page', 1) if request else 1
        
        feed_posts = FeedPost.objects.filter(feed=obj).select_related('post')[:20]
        serializer = FeedPostSerializer(feed_posts, many=True, context=self.context)
        return serializer.data
