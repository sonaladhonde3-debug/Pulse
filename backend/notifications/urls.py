"""
URL routing for notifications app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet, NotificationPreferenceViewSet, NotificationDigestViewSet
)

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')
router.register(r'digests', NotificationDigestViewSet, basename='notification-digest')

urlpatterns = [
    path('', include(router.urls)),
    path('preferences/', NotificationPreferenceViewSet.as_view({'get': 'preferences', 'put': 'preferences'})),
]
