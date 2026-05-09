"""
Main URL routing for backend project.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework import routers

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # JWT Token endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # App URLs
    path('api/users/', include('users.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/interactions/', include('interactions.urls')),
    path('api/notifications/', include('notifications.urls')),
]
