# backend/readings/serializers.py

from rest_framework import serializers
from .models import SensorReading, Alert # Import Alert model

class SensorReadingSerializer(serializers.ModelSerializer):
    """
    Serializer for the SensorReading model.
    """
    class Meta:
        model = SensorReading
        fields = '__all__'

# --- NEW Alert Serializer ---
class AlertSerializer(serializers.ModelSerializer):
    """
    Serializer for the Alert model.
    """
    # Optional: Include related reading details if needed
    # triggering_reading = SensorReadingSerializer(read_only=True) # Could make response large

    # Optional: Format timestamp for better readability
    timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Alert
        fields = [
            'id',
            'sensor_key',
            'trigger_value',
            'threshold_type',
            'threshold_value',
            'message',
            'timestamp',
            'is_active',
            'triggering_reading_id' # Include the ID of the reading
        ]
        # Or use fields = '__all__' if you want everything including the full related reading object
        read_only_fields = ('timestamp',) # Ensure timestamp isn't expected in write operations (if any later)

