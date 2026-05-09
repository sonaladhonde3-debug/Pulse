"""
Views for post management.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from .models import Post, Feed, FeedPost
from .serializers import (
    PostSerializer, PostDetailSerializer, CreatePostSerializer, FeedSerializer
)


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for post management.
    
    GET /api/posts/ - List all posts
    POST /api/posts/ - Create new post
    GET /api/posts/{id}/ - Get post details
    PUT /api/posts/{id}/ - Update post
    DELETE /api/posts/{id}/ - Delete post
    GET /api/posts/{id}/comments/ - Get post comments
    """
    queryset = Post.objects.all().select_related('author').prefetch_related('comments')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['author__username']
    search_fields = ['content', 'author__username']
    ordering_fields = ['created_at', 'likes_count', 'comments_count']
    ordering = ['-created_at']
    pagination_class = None  # Use default pagination from settings

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CreatePostSerializer
        elif self.action == 'retrieve':
            return PostDetailSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        """Save post with current user as author."""
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        """Update only if user is the author."""
        post = self.get_object()
        if post.author != self.request.user:
            raise PermissionError("You can only edit your own posts.")
        serializer.save()

    def perform_destroy(self, instance):
        """Delete only if user is the author."""
        if instance.author != self.request.user:
            raise PermissionError("You can only delete your own posts.")
        instance.delete()

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get comments for a post."""
        post = self.get_object()
        comments = post.comments.all().select_related('author')
        page = self.paginate_queryset(comments)
        if page is not None:
            from interactions.serializers import CommentSerializer
            serializer = CommentSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        from interactions.serializers import CommentSerializer
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)


class FeedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user feed.
    
    GET /api/posts/feed/ - Get user's feed (personalized)
    GET /api/posts/feed/{id}/ - Get specific user's feed
    """
    queryset = Feed.objects.all().select_related('user')
    serializer_class = FeedSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-last_updated']

    @action(detail=False, methods=['get'])
    def my_feed(self, request):
        """Get current user's personalized feed."""
        try:
            feed = request.user.feed
        except Feed.DoesNotExist:
            feed = Feed.objects.create(user=request.user)
        
        serializer = self.get_serializer(feed)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Refresh user's feed."""
        try:
            feed = request.user.feed
        except Feed.DoesNotExist:
            feed = Feed.objects.create(user=request.user)
        
        # Trigger feed update task
        from .tasks import generate_user_feed
        generate_user_feed.delay(request.user.id)
        
        return Response(
            {'detail': 'Feed refresh initiated.'},
            status=status.HTTP_202_ACCEPTED
        )

    @action(detail=False, methods=['get'])
    def explore(self, request):
        """Get trending/explore posts."""
        # Get trending posts (by likes count)
        posts = Post.objects.all().order_by('-likes_count', '-created_at')[:50]
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
