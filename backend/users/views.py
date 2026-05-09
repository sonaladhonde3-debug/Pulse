"""
Views for user authentication and profile management.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from .models import User, Follow, UserSettings
from .serializers import (
    UserSerializer, UserDetailSerializer, SignupSerializer,
    LoginSerializer, ChangePasswordSerializer, FollowSerializer,
    UserSettingsSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management.
    
    GET /api/users/ - List all users
    POST /api/users/ - Create new user (signup)
    GET /api/users/{id}/ - Get user details
    PUT /api/users/{id}/ - Update user profile
    DELETE /api/users/{id}/ - Delete user account
    POST /api/users/{id}/follow/ - Follow user
    POST /api/users/{id}/unfollow/ - Unfollow user
    GET /api/users/{id}/followers/ - Get user's followers
    GET /api/users/{id}/following/ - Get user's following list
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['username', 'email']
    search_fields = ['username', 'first_name', 'last_name', 'bio']
    ordering_fields = ['created_at', 'username', 'followers_count']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'retrieve':
            return UserDetailSerializer
        elif self.action == 'create':
            return SignupSerializer
        elif self.action == 'partial_update' or self.action == 'update':
            return UserSerializer
        return super().get_serializer_class()

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def retrieve(self, request, *args, **kwargs):
        """Get detailed user profile."""
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Update user profile (only own profile)."""
        user = self.get_object()
        if request.user != user:
            return Response(
                {'detail': 'You can only update your own profile.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete user account (only own account)."""
        user = self.get_object()
        if request.user != user:
            return Response(
                {'detail': 'You can only delete your own account.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def follow(self, request, pk=None):
        """Follow a user."""
        user_to_follow = self.get_object()
        follower = request.user

        # Prevent self-follow
        if follower == user_to_follow:
            return Response(
                {'detail': 'You cannot follow yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        follow_obj, created = Follow.objects.get_or_create(
            follower=follower,
            following=user_to_follow
        )

        if not created:
            return Response(
                {'detail': 'Already following this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Send follow notification (Phase 5)
        from notifications.tasks import send_follow_notification
        send_follow_notification.delay(follower.id, user_to_follow.id)

        return Response(
            {'detail': 'Successfully followed user.'},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unfollow(self, request, pk=None):
        """Unfollow a user."""
        user_to_unfollow = self.get_object()
        follower = request.user

        try:
            follow_obj = Follow.objects.get(
                follower=follower,
                following=user_to_unfollow
            )
            follow_obj.delete()
            return Response(
                {'detail': 'Successfully unfollowed user.'},
                status=status.HTTP_200_OK
            )
        except Follow.DoesNotExist:
            return Response(
                {'detail': 'Not following this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        """Get list of user's followers."""
        user = self.get_object()
        followers = user.followers.all()
        page = self.paginate_queryset(followers)
        if page is not None:
            serializer = FollowSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = FollowSerializer(followers, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        """Get list of users that this user is following."""
        user = self.get_object()
        following = user.following.all()
        page = self.paginate_queryset(following)
        if page is not None:
            serializer = FollowSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = FollowSerializer(following, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current authenticated user's profile."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password."""
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response(
                {'detail': 'Password changed successfully.'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def settings(self, request):
        """Get or update user notification settings."""
        user_settings = request.user.settings
        
        if request.method == 'GET':
            serializer = UserSettingsSerializer(user_settings)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            serializer = UserSettingsSerializer(
                user_settings,
                data=request.data,
                partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
