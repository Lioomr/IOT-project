# mqtt_simulator.py
# A script to simulate an ESP32 publishing sensor data to MQTT
# for testing the Django backend receiver and alert system.

import paho.mqtt.client as mqtt
import json
import time
import random

# --- Configuration (Match your Django settings/ESP32 code) ---
MQTT_BROKER_HOST = "71050d0845fc448b9735923211f728af.s1.eu.hivemq.cloud"
MQTT_BROKER_PORT = 8883
MQTT_USERNAME = "lioomr" # Use the same user as Django/ESP32
MQTT_PASSWORD = "Iot12345" # Use the same password
MQTT_KEEPALIVE = 60
MQTT_TLS_ENABLED = True
MQTT_PUB_TOPIC = "sensor/data"
MQTT_CLIENT_ID = f"simulator-client-{random.randint(1000, 9999)}"

PUBLISH_INTERVAL_SECONDS = 8 # How often to send data

# Alert Thresholds (copied from Django settings for reference in generation)
# This helps the simulator know what values might trigger alerts
# ALERT_THRESHOLDS = {
#     'temperature_c': {'min': 18.0, 'max': 30.0},
#     'humidity_percent': {'min': 45.0, 'max': 80.0},
#     'moisture_percent': {'min': 25.0},
#     'ph_value': {'min': 5.8, 'max': 7.2},
#     'gas_ppm': {'max': 1200},
# }

# --- MQTT Callbacks ---
def on_connect(client, userdata, flags, rc, properties=None):
    """Callback for when the client connects to the MQTT broker."""
    if rc == 0:
        print(f"Simulator Connected Successfully to Broker (rc={rc}).")
    else:
        print(f"Simulator Failed to Connect! Result code: {rc}")

def on_disconnect(client, userdata, rc, properties=None):
    """Callback for when the client disconnects."""
    print(f"Simulator Disconnected. Result code: {rc}.")

def on_publish(client, userdata, mid):
    """Callback for when a message is successfully published."""
    print(f"Simulator Published message_id: {mid}")

# --- Data Generation ---
def generate_sensor_data(iteration):
    """Generates simulated sensor data, sometimes triggering alerts."""
    data = {}

    # Normal ranges
    temp_norm = random.uniform(20.0, 28.0)
    humid_norm = random.uniform(50.0, 75.0)
    moisture_norm = random.uniform(30.0, 60.0)
    ph_norm = random.uniform(6.0, 7.0)
    gas_norm = random.uniform(300, 800)
    pressure_norm = random.uniform(1000.0, 1020.0)

    # --- Trigger Alerts Periodically ---
    # Make temperature too high sometimes
    if iteration % 5 == 1:
        data["temperature_c"] = round(random.uniform(31.0, 35.0), 2)
        print("SIMULATOR: Generating HIGH temperature")
    else:
        data["temperature_c"] = round(temp_norm, 2)

    # Make humidity normal (or add low/high conditions)
    data["humidity_percent"] = round(humid_norm, 2)

    # Make moisture too low sometimes
    if iteration % 6 == 2:
        data["moisture_percent"] = round(random.uniform(15.0, 24.0), 1)
        print("SIMULATOR: Generating LOW moisture")
    else:
        data["moisture_percent"] = round(moisture_norm, 1)

    # Make pH too high sometimes
    if iteration % 7 == 3:
         data["ph_value"] = round(random.uniform(7.3, 8.0), 2)
         print("SIMULATOR: Generating HIGH pH")
    else:
         data["ph_value"] = round(ph_norm, 2)

    # Make gas too high sometimes
    if iteration % 8 == 4:
        data["gas_ppm"] = round(random.uniform(1300, 1800), 0)
        print("SIMULATOR: Generating HIGH gas")
    else:
         data["gas_ppm"] = round(gas_norm, 0)

    # Pressure (not currently in alerts, just generate normal)
    data["pressure_hpa"] = round(pressure_norm, 2)

    # Simulate sensor unavailable sometimes
    if iteration % 10 == 5:
        print("SIMULATOR: Simulating unavailable humidity sensor")
        data["humidity_percent"] = "Sensor unavailable" # Send string like ESP32

    return data


# --- Main Script Logic ---
if __name__ == "__main__":
    print("Starting MQTT Simulator...")

    # Initialize MQTT Client
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, MQTT_CLIENT_ID)

    # Assign callbacks
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_publish = on_publish # Optional: confirm publish

    # Set username and password
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    # Enable TLS if required
    if MQTT_TLS_ENABLED:
        try:
            client.tls_set()
            print("Simulator: TLS Enabled.")
        except Exception as e:
            print(f"Simulator: Error setting up TLS: {e}")
            exit() # Exit if TLS setup fails

    # Connect to Broker
    try:
        print(f"Simulator: Connecting to {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}...")
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_KEEPALIVE)
    except Exception as e:
        print(f"Simulator: Connection error: {e}")
        exit() # Exit if connection fails

    # Start the network loop in a non-blocking way
    client.loop_start()

    iteration_count = 0
    try:
        while True:
            iteration_count += 1
            print(f"\n--- Simulator Iteration {iteration_count} ---")

            # Generate data (potentially triggering alerts)
            payload_dict = generate_sensor_data(iteration_count)

            # Convert dictionary to JSON string
            payload_json = json.dumps(payload_dict)

            # Publish the message
            print(f"Simulator: Publishing to topic '{MQTT_PUB_TOPIC}':")
            print(payload_json)
            result = client.publish(MQTT_PUB_TOPIC, payload_json)

            # Check publish status (optional)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"Simulator: Publish queued successfully (mid={result.mid}).")
            else:
                print(f"Simulator: Failed to queue publish (rc={result.rc}).")


            # Wait for the next interval
            time.sleep(PUBLISH_INTERVAL_SECONDS)

    except KeyboardInterrupt:
        print("\nSimulator: Stopping...")
    finally:
        # Stop the network loop and disconnect
        client.loop_stop()
        client.disconnect()
        print("Simulator: Disconnected and stopped.")

