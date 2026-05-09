"""
Views for interactions (likes and comments).
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import Like, Comment, CommentLike
from posts.models import Post
from .serializers import (
    LikeSerializer, CommentSerializer, CreateCommentSerializer,
    CreateLikeSerializer, CommentLikeSerializer, CreateCommentLikeSerializer
)


class LikeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing post likes.
    
    GET /api/interactions/likes/ - List all likes
    POST /api/interactions/likes/ - Like a post
    DELETE /api/interactions/likes/{id}/ - Unlike a post
    """
    queryset = Like.objects.all().select_related('user', 'post')
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['post', 'user']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CreateLikeSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        """Create like with current user."""
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Delete only if user is the one who liked."""
        if instance.user != self.request.user:
            raise PermissionError("You can only delete your own likes.")
        instance.delete()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle(self, request):
        """Toggle like on a post."""
        post_id = request.data.get('post_id')
        if not post_id:
            return Response(
                {'error': 'post_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        post = get_object_or_404(Post, id=post_id)
        like_obj = Like.objects.filter(user=request.user, post=post).first()

        if like_obj:
            like_obj.delete()
            return Response(
                {'detail': 'Like removed', 'liked': False},
                status=status.HTTP_200_OK
            )
        else:
            Like.objects.create(user=request.user, post=post)
            return Response(
                {'detail': 'Post liked', 'liked': True},
                status=status.HTTP_201_CREATED
            )


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing comments.
    
    GET /api/interactions/comments/ - List all comments
    POST /api/interactions/comments/ - Create comment
    GET /api/interactions/comments/{id}/ - Get comment details
    PUT /api/interactions/comments/{id}/ - Update comment
    DELETE /api/interactions/comments/{id}/ - Delete comment
    """
    queryset = Comment.objects.all().select_related('author', 'post')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['post', 'author']
    ordering_fields = ['created_at', 'likes_count']
    ordering = ['created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CreateCommentSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        """Create comment with current user as author."""
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        """Update only if user is the author."""
        comment = self.get_object()
        if comment.author != self.request.user:
            raise PermissionError("You can only edit your own comments.")
        serializer.save()

    def perform_destroy(self, instance):
        """Delete only if user is the author."""
        if instance.author != self.request.user:
            raise PermissionError("You can only delete your own comments.")
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Like a comment."""
        comment = self.get_object()
        like_obj, created = CommentLike.objects.get_or_create(
            user=request.user,
            comment=comment
        )
        if created:
            return Response(
                {'detail': 'Comment liked'},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'detail': 'Already liked'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        """Unlike a comment."""
        comment = self.get_object()
        like_obj = CommentLike.objects.filter(
            user=request.user,
            comment=comment
        ).first()
        if like_obj:
            like_obj.delete()
            return Response(
                {'detail': 'Comment unliked'},
                status=status.HTTP_200_OK
            )
        return Response(
            {'detail': 'Not liked'},
            status=status.HTTP_400_BAD_REQUEST
        )


class CommentLikeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing comment likes.
    """
    queryset = CommentLike.objects.all().select_related('user', 'comment')
    serializer_class = CommentLikeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['comment', 'user']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CreateCommentLikeSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        """Create comment like with current user."""
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Delete only if user is the one who liked."""
        if instance.user != self.request.user:
            raise PermissionError("You can only delete your own likes.")
        instance.delete()
