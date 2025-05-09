# backend/readings/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions

# Import models and serializers
from .models import SensorReading, Alert
from .serializers import SensorReadingSerializer, AlertSerializer # Import AlertSerializer

# --- Existing Views ---
class LatestReadingView(APIView):
    """
    API view to retrieve the most recent sensor reading.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, format=None):
        try:
            latest_reading = SensorReading.objects.order_by('-timestamp').first()
            if latest_reading is None:
                return Response({"error": "No sensor readings found."}, status=status.HTTP_404_NOT_FOUND)
            serializer = SensorReadingSerializer(latest_reading)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistoricalReadingsView(APIView):
    """
    API view to retrieve historical sensor readings.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, format=None):
        try:
            # TODO: Add pagination and filtering for production
            historical_readings = SensorReading.objects.all().order_by('-timestamp')
            serializer = SensorReadingSerializer(historical_readings, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- NEW Alert List View ---
class AlertListView(APIView):
    permission_classes = [permissions.AllowAny] 

    def get(self, request, format=None):
        try:
            # Fetch alerts - potentially filter for active ones later
            # Example: Fetch only active alerts, newest first
            alerts = Alert.objects.filter(is_active=True).order_by('-timestamp')
            # Or fetch all alerts:
            # alerts = Alert.objects.all().order_by('-timestamp')

            # TODO: Add pagination for production if the list can grow large
            serializer = AlertSerializer(alerts, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            # Handle potential unexpected errors
            return Response(
                {"error": f"An error occurred fetching alerts: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

