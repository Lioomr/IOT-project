# GrowVision - IoT Greenhouse Monitoring System

## Description

GrowVision is a full-stack application designed to monitor environmental conditions within a greenhouse using IoT sensors (ESP32). Data is sent via MQTT to a cloud broker, processed by a Django backend, and visualized on a Next.js frontend dashboard.

## Project Structure

growvision_project/├── frontend/      # Next.js Frontend Application├── backend/       # Django Backend Application├── arduino/       # ESP32 Sensor Code (Optional Location)├── .gitignore     # Files ignored by Git└── README.md      # This file
## Prerequisites

Before you begin, ensure you have the following installed:

* **Git:** For cloning and version control. ([Download Git](https://git-scm.com/downloads))
* **Node.js and npm (or yarn):** For the Next.js frontend. (Recommend LTS version) ([Download Node.js](https://nodejs.org/))
* **Python and pip:** For the Django backend. (Recommend Python 3.8+) ([Download Python](https://www.python.org/downloads/))
* **(Optional) Arduino IDE:** If you need to modify or upload the ESP32 code. ([Download Arduino IDE](https://www.arduino.cc/en/software))
* **(Optional) MQTT Client Tool:** Such as MQTT Explorer for debugging MQTT messages.

## Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd growvision_project
    ```

2.  **Backend Setup (Django):**
    * Navigate to the backend directory:
        ```bash
        cd backend
        ```
    * Create and activate a Python virtual environment:
        ```bash
        # Create venv (if it doesn't exist)
        python -m venv venv
        # Activate venv
        # Windows:
        # venv\Scripts\activate
        # macOS/Linux:
        # source venv/bin/activate
        ```
    * Install required Python packages:
        ```bash
        pip install -r requirements.txt
        ```
    * Set up backend environment variables:
        * Copy the example file: `cp .env.example .env` (use `copy` instead of `cp` on Windows CMD).
        * Edit the `.env` file and add your actual `MQTT_PASSWORD`. Update other variables like `SECRET_KEY` and `DEBUG` if you move them from `settings.py`.
    * Apply database migrations:
        ```bash
        python manage.py migrate
        ```
    * Go back to the root directory:
        ```bash
        cd ..
        ```

3.  **Frontend Setup (Next.js):**
    * Navigate to the frontend directory:
        ```bash
        cd frontend
        ```
    * Install required Node.js packages:
        ```bash
        # Using npm:
        npm install
        # Or using yarn:
        # yarn install
        ```
    * Set up frontend environment variables:
        * Copy the example file: `cp .env.local.example .env.local` (use `copy` on Windows CMD).
        * Edit `.env.local` if your backend API URL is different from the default `http://127.0.0.1:8000`.
    * Go back to the root directory:
        ```bash
        cd ..
        ```

4.  **Hardware Setup (ESP32/Arduino - Optional):**
    * Navigate to the `arduino/` directory (or wherever the `.ino` file is).
    * Open the `.ino` sketch file in the Arduino IDE.
    * **Install Libraries:** Ensure you have the necessary libraries installed via the Arduino Library Manager:
        * `PubSubClient` by Nick O'Leary
        * `MQ135` (You might need to find a specific version or source for this)
        * `BME280I2C` by Tyler Glenn (or another BME280 library compatible with I2C)
        * Libraries for your specific ESP32 board if needed.
    * **Configure Sketch:** Update the following variables in the sketch with your credentials:
        * `ssid` (Your WiFi network name)
        * `password` (Your WiFi password)
        * `mqtt_user` (Your HiveMQ username)
        * `mqtt_pass` (Your HiveMQ password)
        * *(Consider moving these to a separate config header file for security)*
    * **Upload:** Select your ESP32 board and port in the Arduino IDE and upload the sketch. Monitor the Serial Monitor (Baud Rate: 115200) for connection status and sensor readings.

## Running the Application

You typically need three terminals open simultaneously:

1.  **Terminal 1: Start Django MQTT Client:**
    * Navigate to the `backend/` directory.
    * Activate the virtual environment (`source venv/bin/activate` or `venv\Scripts\activate`).
    * Run the client:
        ```bash
        python manage.py start_mqtt_client
        ```
    * Leave this running. It listens for MQTT messages and saves data.

2.  **Terminal 2: Start Django Development Server:**
    * Navigate to the `backend/` directory.
    * Activate the virtual environment.
    * Run the server:
        ```bash
        python manage.py runserver
        ```
    * This serves the Django API, usually at `http://127.0.0.1:8000/`.

3.  **Terminal 3: Start Next.js Development Server:**
    * Navigate to the `frontend/` directory.
    * Run the server:
        ```bash
        # Using npm:
        npm run dev
        # Or using yarn:
        # yarn dev
        ```
    * This serves the Next.js frontend, usually at `http://localhost:3000/`.

4.  **Access the Application:** Open your web browser and go to `http://localhost:3000`.

---

*(Optional: Add sections for Contribution Guidelines, License, etc. here)*

