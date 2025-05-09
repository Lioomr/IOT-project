# backend/readings/models.py

from django.db import models
from django.utils import timezone

class SensorReading(models.Model):
    timestamp = models.DateTimeField(default=timezone.now)
    gas_ppm = models.FloatField(null=True, blank=True)
    moisture_percent = models.FloatField(null=True, blank=True)
    temperature_c = models.FloatField(null=True, blank=True)
    humidity_percent = models.FloatField(null=True, blank=True)
    pressure_hpa = models.FloatField(null=True, blank=True)
    ph_value = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Reading at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    class Meta:
        ordering = ['-timestamp']

# --- NEW Alert Model ---
class Alert(models.Model):
    triggering_reading = models.ForeignKey(
        SensorReading,
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='alerts'
    )
    sensor_key = models.CharField(max_length=50) # e.g., 'temperature_c', 'humidity_percent'
    trigger_value = models.FloatField(null=True, blank=True) # The value that caused the alert
    threshold_type = models.CharField(max_length=10) # e.g., 'min', 'max'
    threshold_value = models.FloatField(null=True, blank=True) # The threshold value that was breached
    message = models.TextField() # The generated alert message
    timestamp = models.DateTimeField(default=timezone.now) # When the alert was created
    is_active = models.BooleanField(default=True) # Flag to indicate if the alert condition is still current

    def __str__(self):
        status = "Active" if self.is_active else "Resolved"
        return f"{status} Alert ({self.sensor_key}) at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    class Meta:
        ordering = ['-timestamp'] # Show newest alerts first

