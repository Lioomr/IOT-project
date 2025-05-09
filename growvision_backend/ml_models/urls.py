# backend/ml_models/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('disease-detect/', views.DiseaseDetectionView.as_view(), name='disease_detect'),
    path('yolo-predict/', views.YoloPredictionView.as_view(), name='yolo_predict'),
    path('lstm-predict/', views.LstmPredictionView.as_view(), name='lstm_predict'),
]
