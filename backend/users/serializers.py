"""
Serializers for user-related endpoints.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Follow, UserSettings


class UserSerializer(serializers.ModelSerializer):
    """
    Basic user serializer for public user profiles.
    """
    is_following = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'bio', 'profile_picture', 'is_following',
            'follower_count', 'following_count', 'posts_count',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'posts_count']

    def get_is_following(self, obj):
        """Check if current user is following this user."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(
                follower=request.user,
                following=obj
            ).exists()
        return False

    def get_follower_count(self, obj):
        return obj.followers_count

    def get_following_count(self, obj):
        return obj.following_count


class UserDetailSerializer(UserSerializer):
    """
    Detailed user serializer with additional information.
    """
    posts = serializers.SerializerMethodField()
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['posts']

    def get_posts(self, obj):
        """Get recent posts by user."""
        from posts.serializers import PostSerializer
        posts = obj.posts.all()[:5]
        return PostSerializer(posts, many=True, context=self.context).data


class SignupSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm'
        ]

    def validate_username(self, value):
        """Validate username is unique and valid."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters.")
        return value

    def validate_email(self, value):
        """Validate email is unique and valid."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_password(self, value):
        """Validate password strength."""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value

    def validate(self, data):
        """Validate password confirmation matches."""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Passwords do not match.'
            })
        return data

    def create(self, validated_data):
        """Create new user."""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password.
    """
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    new_password_confirm = serializers.CharField(write_only=True, required=True)

    def validate_new_password(self, value):
        """Validate new password strength."""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        return value

    def validate(self, data):
        """Validate passwords match and old password is correct."""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password': 'Passwords do not match.'
            })
        
        user = self.context['request'].user
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError({
                'old_password': 'Old password is incorrect.'
            })
        
        return data


class FollowSerializer(serializers.ModelSerializer):
    """
    Serializer for follow relationships.
    """
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['created_at']


class UserSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for user notification settings.
    """
    class Meta:
        model = UserSettings
        fields = [
            'notify_on_like', 'notify_on_comment', 'notify_on_follow',
            'notify_on_mention', 'notification_frequency',
            'email_notifications_enabled', 'email_on_like',
            'email_on_comment', 'email_on_follow',
            'private_account', 'allow_messages'
        ]

    def update(self, instance, validated_data):
        """Update user settings."""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
