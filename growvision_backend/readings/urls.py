# readings/urls.py

from django.urls import path
from . import views # Import views from the current app

urlpatterns = [
    path('latest/', views.LatestReadingView.as_view(), name='latest_reading'),
    path('history/', views.HistoricalReadingsView.as_view(), name='historical_readings'),
    path('alerts/', views.AlertListView.as_view(), name='alert_list')
]