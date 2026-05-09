"""
URL routing for interactions app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LikeViewSet, CommentViewSet, CommentLikeViewSet

router = DefaultRouter()
router.register(r'likes', LikeViewSet, basename='like')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'comment-likes', CommentLikeViewSet, basename='comment-like')

urlpatterns = [
    path('', include(router.urls)),
]
