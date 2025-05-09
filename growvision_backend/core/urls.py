# backend/core/urls.py
from django.contrib import admin
from django.urls import path, include 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('readings.urls')),
    path('api/ml/', include('ml_models.urls')), 
]