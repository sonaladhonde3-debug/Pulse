"""
Serializers for interactions (likes and comments).
"""

from rest_framework import serializers
from .models import Like, Comment, CommentLike
from users.serializers import UserSerializer


class LikeSerializer(serializers.ModelSerializer):
    """
    Serializer for post likes.
    """
    user = UserSerializer(read_only=True)

    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'created_at']
        read_only_fields = ['id', 'user', 'post', 'created_at']


class CommentLikeSerializer(serializers.ModelSerializer):
    """
    Serializer for comment likes.
    """
    user = UserSerializer(read_only=True)

    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'comment', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer for comments.
    """
    author = UserSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_author = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'author', 'post', 'content',
            'likes_count', 'is_liked', 'is_author',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'post', 'likes_count', 'created_at', 'updated_at']

    def get_is_liked(self, obj):
        """Check if current user has liked this comment."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CommentLike.objects.filter(
                user=request.user,
                comment=obj
            ).exists()
        return False

    def get_is_author(self, obj):
        """Check if current user is the comment author."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False

    def validate_content(self, value):
        """Validate comment content."""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment cannot be empty.")
        if len(value) > 1000:
            raise serializers.ValidationError("Comment cannot exceed 1000 characters.")
        return value


class CreateCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for creating comments.
    """
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Comment
        fields = ['content', 'post', 'author']

    def validate_content(self, value):
        """Validate comment content."""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment cannot be empty.")
        if len(value) > 1000:
            raise serializers.ValidationError("Comment cannot exceed 1000 characters.")
        return value


class CreateLikeSerializer(serializers.ModelSerializer):
    """
    Serializer for creating likes.
    """
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Like
        fields = ['user', 'post']

    def validate(self, data):
        """Validate user hasn't already liked this post."""
        if Like.objects.filter(user=data['user'], post=data['post']).exists():
            raise serializers.ValidationError("You have already liked this post.")
        return data

    def create(self, validated_data):
        """Create new like."""
        like, created = Like.objects.get_or_create(**validated_data)
        if not created:
            raise serializers.ValidationError("You have already liked this post.")
        return like


class CreateCommentLikeSerializer(serializers.ModelSerializer):
    """
    Serializer for creating comment likes.
    """
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = CommentLike
        fields = ['user', 'comment']

    def validate(self, data):
        """Validate user hasn't already liked this comment."""
        if CommentLike.objects.filter(user=data['user'], comment=data['comment']).exists():
            raise serializers.ValidationError("You have already liked this comment.")
        return data

    def create(self, validated_data):
        """Create new comment like."""
        like, created = CommentLike.objects.get_or_create(**validated_data)
        if not created:
            raise serializers.ValidationError("You have already liked this comment.")
        return like
