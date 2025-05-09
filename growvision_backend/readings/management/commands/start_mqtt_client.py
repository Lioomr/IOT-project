# backend/readings/management/commands/start_mqtt_client.py

import json
import time
import os # <--- Ensure os is imported
import paho.mqtt.client as mqtt
from django.core.management.base import BaseCommand
from django.conf import settings
from readings.models import SensorReading, Alert
from django.utils import timezone
# from readings.utils import send_alert_sms
from dotenv import load_dotenv # <--- Import load_dotenv
from pathlib import Path # <--- Import Path

# --- Helper Function to Parse Sensor Value ---
# (No changes needed in this function)
def parse_sensor_value(value):
    if isinstance(value, (int, float)): return float(value)
    if isinstance(value, str):
        error_strings = ["Sensor is sleeping", "Sensor unavailable", "Invalid reading"]
        if value in error_strings: return None
        try: return float(value)
        except ValueError: return None
    return None

# --- Function to Check Alerts ---
# (No changes needed in this function)
def check_alerts(reading: SensorReading):
    thresholds = settings.ALERT_THRESHOLDS
    for sensor_key, config in thresholds.items():
        if not hasattr(reading, sensor_key): continue
        value = getattr(reading, sensor_key)
        if value is None or not isinstance(value, (int, float)): continue

        breached = False; threshold_type = None; threshold_value = None; alert_message = ""
        min_threshold = config.get('min')
        if min_threshold is not None and value < min_threshold:
            breached = True; threshold_type = 'min'; threshold_value = min_threshold
            print(f"ALERT Condition: {sensor_key} ({value:.2f}) < MIN ({min_threshold:.2f})")
        max_threshold = config.get('max')
        if not breached and max_threshold is not None and value > max_threshold:
            breached = True; threshold_type = 'max'; threshold_value = max_threshold
            print(f"ALERT Condition: {sensor_key} ({value:.2f}) > MAX ({max_threshold:.2f})")

        if breached:
            try:
                message_template = config.get('message', 'Alert for {sensor_key}: value {value}')
                alert_message = message_template.format(value=value, min=min_threshold, max=max_threshold, sensor_key=sensor_key)
            except KeyError as e:
                print(f"Warning: Formatting key error in alert message for {sensor_key}: {e}")
                alert_message = f"Alert: {sensor_key} value {value:.2f} breached threshold {threshold_type} ({threshold_value:.2f})"
            try:
                alert = Alert.objects.create(triggering_reading=reading, sensor_key=sensor_key, trigger_value=value, threshold_type=threshold_type, threshold_value=threshold_value, message=alert_message, is_active=True)
                print(f"--- ALERT CREATED (ID: {alert.id}): {alert_message} ---")
                # send_alert_sms(alert) # Call the SMS function
            except Exception as e: print(f"Error creating alert or sending SMS: {e}")

# --- MQTT Callback Functions ---
# (No changes needed in these functions)
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0: print(f"MQTT Client Connected Successfully (rc={rc}). Subscribing..."); topic = settings.MQTT_SETTINGS.get('MQTT_SUB_TOPIC', 'sensor/data'); client.subscribe(topic); print(f"Subscribed to topic: {topic}")
    else: print(f"MQTT Connection Failed! Result code: {rc}")
def on_disconnect(client, userdata, rc, properties=None): print(f"MQTT Client Disconnected. Result code: {rc}. Attempting reconnection...")
def on_message(client, userdata, msg):
    try:
        payload_str = msg.payload.decode("utf-8"); print(f"Received message on topic '{msg.topic}': {payload_str}"); data = json.loads(payload_str)
        reading = SensorReading(timestamp=timezone.now()); reading.gas_ppm = parse_sensor_value(data.get("gas_ppm")); reading.moisture_percent = parse_sensor_value(data.get("moisture_percent")); reading.temperature_c = parse_sensor_value(data.get("temperature_c")); reading.humidity_percent = parse_sensor_value(data.get("humidity_percent")); reading.pressure_hpa = parse_sensor_value(data.get("pressure_hpa")); reading.ph_value = parse_sensor_value(data.get("ph_value"))
        try: reading.save(); print(f"Saved reading ID: {reading.id} at {reading.timestamp}"); check_alerts(reading)
        except Exception as db_error: print(f"Error saving reading or checking alerts: {db_error}")
    except json.JSONDecodeError: print(f"Error decoding JSON payload: {payload_str}")
    except Exception as e: print(f"An error occurred processing message: {e}"); print(f"Topic: {msg.topic}, Payload: {msg.payload.decode('utf-8', errors='ignore')}")

# --- Django Management Command ---
class Command(BaseCommand):
    help = 'Starts the MQTT client to listen for sensor readings, check for alerts, and send SMS notifications.'

    def handle(self, *args, **options):
        env_path = Path('.') / '.env' 
        loaded = load_dotenv(dotenv_path=env_path, verbose=True) # verbose=True prints debug info
        self.stdout.write(self.style.SUCCESS('Starting MQTT client...'))
        broker_host = settings.MQTT_SETTINGS.get('MQTT_BROKER_HOST'); broker_port = settings.MQTT_SETTINGS.get('MQTT_BROKER_PORT'); username = settings.MQTT_SETTINGS.get('MQTT_USERNAME'); password = settings.MQTT_SETTINGS.get('MQTT_PASSWORD'); keepalive = settings.MQTT_SETTINGS.get('MQTT_KEEPALIVE', 60); client_id = settings.MQTT_SETTINGS.get('MQTT_CLIENT_ID', f'django-mqtt-{int(time.time())}'); use_tls = settings.MQTT_SETTINGS.get('MQTT_TLS_ENABLED', False)
        if not all([broker_host, broker_port, username, password]): self.stderr.write(self.style.ERROR('MQTT settings missing...')); return
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id); client.on_connect = on_connect; client.on_disconnect = on_disconnect; client.on_message = on_message; client.username_pw_set(username, password)
        if use_tls:
            try: client.tls_set(); print("TLS Enabled for MQTT connection.")
            except Exception as e: self.stderr.write(self.style.ERROR(f'Error setting up TLS: {e}')); return
        try:
            self.stdout.write(f"Connecting to MQTT broker at {broker_host}:{broker_port}..."); client.connect(broker_host, broker_port, keepalive); self.stdout.write(self.style.SUCCESS('MQTT client connected and listening. Press Ctrl+C to stop.')); client.loop_forever()
        except ConnectionRefusedError: self.stderr.write(self.style.ERROR(f'MQTT connection refused...'))
        except Exception as e: self.stderr.write(self.style.ERROR(f'An unexpected error occurred: {e}'))
        except KeyboardInterrupt: self.stdout.write(self.style.WARNING('\nStopping MQTT client...')); client.disconnect(); self.stdout.write(self.style.SUCCESS('MQTT client disconnected gracefully.'))

