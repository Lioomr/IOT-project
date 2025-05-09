# backend/ml_models/services.py

import tensorflow as tf
# Use tensorflow.keras for modern TensorFlow
from tensorflow.keras.preprocessing import image as keras_image # type: ignore
from tensorflow.keras.applications.densenet import preprocess_input as densenet_preprocess_input # type: ignore
import torch # For YOLO .pt model
import logging
import os
import io
from PIL import Image
import numpy as np
from django.conf import settings
from readings.models import SensorReading # To fetch data for LSTM

# Import scaler and joblib for LSTM
from sklearn.preprocessing import MinMaxScaler # Assuming MinMaxScaler was used
import joblib

# Import custom layer
from .custom_layers import AttentionLayer # Assuming AttentionLayer is in custom_layers.py

# Attempt to import ultralytics
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
    logger = logging.getLogger(__name__)
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    YOLO = None # Define YOLO as None if ultralytics is not installed
    logger = logging.getLogger(__name__) # Define logger even if import fails
    logger.warning("Ultralytics YOLO library not found. YOLO prediction will not work unless alternative loading is implemented.")


# --- Define Custom Class Names (DenseNet) ---
# Based on user's updated list for DenseNet201
CLASS_NAMES_DENSENET = [
    "Tomato_Bacterial_spot",
    "Tomato_blight",
    "Tomato_healthy",
    "Tomato_Leaf_Mold",
    "Tomato_mosaic_virus",
    "Tomato_Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite",
    "Tomato_YellowLeaf_Curl_Virus"
]
NUM_CLASSES_DENSENET = len(CLASS_NAMES_DENSENET) # Should be 8

# --- Define Custom Class Names (YOLO - Fallback) ---
# This list will be used ONLY if the loaded model doesn't contain embedded names
CLASS_NAMES_YOLO_FALLBACK = [
    "tomato", "leaf", "stem", "pest", "flower" # Example placeholder names
]

# --- LSTM Configuration ---
# Based on user input from notebook and previous messages
# Features from notebook: ['temperature___c', 'humidity_', 'soil_moisture', 'solar_radiation_ghi', 'ph']
# Mapping to SensorReading model fields (CRITICAL: Ensure these are correct and data is available)
# If 'solar_radiation_ghi' was a distinct feature in training and is not 'gas_ppm',
# SensorReading model and ESP32 data feed need to be updated.
FEATURE_COLUMNS_LSTM_ACTUAL = ["temperature_c", "humidity_percent", "moisture_percent", "gas_ppm", "ph_value"]
SEQUENCE_LENGTH_LSTM = 20
NUM_FEATURES_LSTM = len(FEATURE_COLUMNS_LSTM_ACTUAL)

# LSTM Output is regression (days_of_planted), not classification
# CLASS_NAMES_LSTM is not needed for regression outputting a single value.
# NUM_CLASSES_LSTM = 1 # For a single regression output


# --- Model Loading ---
MODEL_DIR = os.path.join(settings.BASE_DIR, 'ml_models', 'saved_models')

# --- DenseNet Loading (Using exact filename for DenseNet201) ---
DENSENET_FILENAME = "DenseNet201_model.h5"
densenet_model_path = os.path.join(MODEL_DIR, DENSENET_FILENAME)
densenet_model = None
if os.path.exists(densenet_model_path):
    try:
        logger.info(f"Loading DenseNet201 model from: {densenet_model_path}")
        densenet_model = tf.keras.models.load_model(densenet_model_path)
        try: # Verify output shape
            output_shape = densenet_model.output_shape
            if output_shape[-1] != NUM_CLASSES_DENSENET:
                 logger.warning(f"DenseNet201 Model output shape {output_shape} last dimension ({output_shape[-1]}) does not match NUM_CLASSES_DENSENET ({NUM_CLASSES_DENSENET}). Check CLASS_NAMES_DENSENET order/completeness and model architecture.")
            else:
                 logger.info(f"DenseNet201 Model output shape {output_shape} matches NUM_CLASSES_DENSENET ({NUM_CLASSES_DENSENET}).")
        except Exception as shape_e: logger.warning(f"Could not verify DenseNet201 model output shape: {shape_e}")
        logger.info("DenseNet201 model loaded successfully.")
    except Exception as e: logger.error(f"Error loading DenseNet201 model from {densenet_model_path}: {e}", exc_info=True)
else:
    logger.error(f"DenseNet201 model file ('{DENSENET_FILENAME}') not found at {densenet_model_path}.")


# --- YOLO Loading ---
yolo_model_path = os.path.join(MODEL_DIR, 'best.pt')
yolo_model = None
yolo_class_names = CLASS_NAMES_YOLO_FALLBACK # Default to fallback list
if ULTRALYTICS_AVAILABLE and os.path.exists(yolo_model_path):
    try:
        logger.info(f"Loading YOLO model from: {yolo_model_path}")
        yolo_model = YOLO(yolo_model_path)
        if hasattr(yolo_model, 'names') and isinstance(yolo_model.names, dict):
             yolo_class_names = yolo_model.names; logger.info(f"Using YOLO model's embedded class names (dict): {yolo_class_names}")
        elif hasattr(yolo_model, 'names') and isinstance(yolo_model.names, list):
             yolo_class_names = yolo_model.names; logger.info(f"Using YOLO model's embedded class names (list): {yolo_class_names}")
        else: logger.warning(f"YOLO model loaded, but 'names' attribute not found/invalid. Using fallback list."); yolo_class_names = CLASS_NAMES_YOLO_FALLBACK
        logger.info("YOLO model loaded successfully using Ultralytics.")
    except Exception as e:
        logger.error(f"Error loading YOLO model from {yolo_model_path} using Ultralytics: {e}", exc_info=True)
        yolo_model = None
elif not ULTRALYTICS_AVAILABLE:
     logger.error("YOLO model loading skipped: Ultralytics library not installed.")
else:
    logger.error(f"YOLO model file ('best.pt') not found at {yolo_model_path}.")


# --- LSTM Loading (With Custom AttentionLayer) ---
LSTM_MODEL_FILENAME = "best_tomato_lstm_attention_model.h5"
lstm_model_path = os.path.join(MODEL_DIR, LSTM_MODEL_FILENAME)
lstm_model = None
lstm_scaler = None

SCALER_FILENAME_LSTM = 'lstm_scaler.joblib' # Or .pkl, ensure this matches your saved file
scaler_path_lstm = os.path.join(MODEL_DIR, SCALER_FILENAME_LSTM)

if os.path.exists(scaler_path_lstm):
    try:
        lstm_scaler = joblib.load(scaler_path_lstm)
        logger.info(f"LSTM scaler loaded successfully from {scaler_path_lstm}")
        if hasattr(lstm_scaler, 'n_features_in_') and lstm_scaler.n_features_in_ != NUM_FEATURES_LSTM:
            logger.warning(f"Loaded LSTM scaler expects {lstm_scaler.n_features_in_} features, but NUM_FEATURES_LSTM is {NUM_FEATURES_LSTM}.")
    except Exception as e:
        logger.error(f"Error loading LSTM scaler from {scaler_path_lstm}: {e}", exc_info=True)
        lstm_scaler = None
else:
    logger.warning(f"LSTM scaler file ('{SCALER_FILENAME_LSTM}') not found at {scaler_path_lstm}. Predictions will be attempted without scaling if scaler is None (likely inaccurate).")


if os.path.exists(lstm_model_path):
    try:
        logger.info(f"Loading LSTM model from: {lstm_model_path}")
        lstm_model = tf.keras.models.load_model(
            lstm_model_path,
            custom_objects={'AttentionLayer': AttentionLayer} # Register custom layer
        )
        try: # Verify output shape (for regression, last dim is usually 1)
            output_shape = lstm_model.output_shape
            if output_shape[-1] != 1: # LSTM predicts a single value (days_of_planted)
                 logger.warning(f"LSTM Model output shape {output_shape} last dimension ({output_shape[-1]}) is not 1, as expected for regression. Check model architecture.")
            else:
                 logger.info(f"LSTM Model output shape {output_shape} is suitable for regression.")
        except Exception as shape_e:
             logger.warning(f"Could not verify LSTM model output shape: {shape_e}")
        logger.info("LSTM model loaded successfully.")
    except Exception as e: # Catch all exceptions for robust logging
        logger.error(f"Error loading LSTM model from {lstm_model_path}: {e}", exc_info=True)
else:
    logger.error(f"LSTM model file ('{LSTM_MODEL_FILENAME}') not found at {lstm_model_path}.")


# --- Prediction Function (DenseNet Disease Detection) ---
def predict_disease(image_file):
    """Predicts plant disease using the custom-trained DenseNet201 model."""
    if densenet_model is None:
        logger.error("DenseNet201 model is not loaded, cannot predict disease.")
        return None
    try:
        image_data = image_file.read()
        image_bytes_io = io.BytesIO(image_data)
        image_file.seek(0) # Reset file pointer in case it was read before
        # Using target_size (128,128) as per user's working version
        img = keras_image.load_img(io.BytesIO(image_file.read()), target_size=(128, 128))
        img_array = keras_image.img_to_array(img)
        img_array_expanded = np.expand_dims(img_array, axis=0)
        # Use DenseNet specific preprocessing
        img_preprocessed = densenet_preprocess_input(img_array_expanded)

        logger.info("Running DenseNet201 prediction...")
        predictions = densenet_model.predict(img_preprocessed)
        logger.debug(f"DenseNet201 Raw prediction output: {predictions}")

        if predictions is None or predictions.shape != (1, NUM_CLASSES_DENSENET):
            logger.error(f"DenseNet201 prediction output shape unexpected: {predictions.shape if predictions is not None else 'None'} vs expected (1, {NUM_CLASSES_DENSENET})")
            return None
        predicted_index = np.argmax(predictions[0])
        confidence_score = np.max(predictions[0]) * 100
        if 0 <= predicted_index < NUM_CLASSES_DENSENET:
            predicted_class_name = CLASS_NAMES_DENSENET[predicted_index]
            logger.info(f"DenseNet201 Predicted class: {predicted_class_name} (Confidence: {confidence_score:.2f}%)")
        else:
            logger.error(f"DenseNet201 Predicted index {predicted_index} out of bounds for {NUM_CLASSES_DENSENET} classes.")
            return None
        return {"class_name": predicted_class_name.replace('_', ' '), "confidence": round(confidence_score, 2)}
    except Exception as e:
        logger.error(f"Error predicting disease with DenseNet201: {e}", exc_info=True)
        return None

# --- Prediction Function (YOLO Object Detection) ---
def predict_yolo_objects(image_file):
    """Detects objects using the loaded YOLO model."""
    global yolo_class_names # Access the names loaded/set globally
    if yolo_model is None or not ULTRALYTICS_AVAILABLE:
        logger.error("YOLO model is not loaded or Ultralytics not available, cannot predict.")
        return None
    try:
        image_file.seek(0) # Reset file pointer
        img = Image.open(image_file)
        if img.mode != 'RGB': img = img.convert('RGB')
        logger.info(f"Loaded image for YOLO, size: {img.size}, mode: {img.mode}")
        logger.info("Running YOLO prediction...");
        results = yolo_model(img, conf=0.25) # conf is confidence threshold
        detections = []
        if results and len(results) > 0:
            result = results[0]; boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                confidence = round(float(box.conf[0]), 4)
                class_index = int(box.cls[0])
                class_name = "Unknown"
                if isinstance(yolo_class_names, dict): class_name = yolo_class_names.get(class_index, "Unknown")
                elif isinstance(yolo_class_names, list):
                    if 0 <= class_index < len(yolo_class_names): class_name = yolo_class_names[class_index]
                    else: logger.warning(f"YOLO class index {class_index} out of bounds for names list (len {len(yolo_class_names)}).")
                detections.append({"box": [x1, y1, x2, y2], "class_name": class_name, "confidence": confidence})
            logger.info(f"YOLO detected {len(detections)} objects.")
        else: logger.info("YOLO prediction returned no results.")
        return detections
    except Exception as e: logger.error(f"Error predicting YOLO objects: {e}", exc_info=True); return None


# --- Prediction Function (LSTM - for regression, e.g., days_of_planted) ---
def predict_lstm_value(sensor_data_df):
    """
    Predicts a continuous value (e.g., days_of_planted) based on a sequence of sensor data.
    Args:
        sensor_data_df: A Pandas DataFrame (SEQUENCE_LENGTH_LSTM, NUM_FEATURES_LSTM)
                         with columns FEATURE_COLUMNS_LSTM_ACTUAL, ordered oldest to newest.
    Returns:
        A dictionary {'predicted_value': float} or None if error.
    """
    global lstm_model, lstm_scaler

    if lstm_model is None:
        logger.error("LSTM model is not loaded, cannot predict.")
        return None

    if sensor_data_df.shape[0] != SEQUENCE_LENGTH_LSTM:
        logger.error(f"Input data has {sensor_data_df.shape[0]} time steps, expected {SEQUENCE_LENGTH_LSTM}.")
        return None
    if sensor_data_df.shape[1] != NUM_FEATURES_LSTM:
        logger.error(f"Input data has {sensor_data_df.shape[1]} features, expected {NUM_FEATURES_LSTM}.")
        return None
    if list(sensor_data_df.columns) != FEATURE_COLUMNS_LSTM_ACTUAL:
        logger.error(f"Input data columns {list(sensor_data_df.columns)} do not match expected {FEATURE_COLUMNS_LSTM_ACTUAL}.")
        return None

    try:
        logger.info(f"Running LSTM prediction with input data of shape: {sensor_data_df.shape}")
        data_values = sensor_data_df.values.astype(np.float32)

        if lstm_scaler is None:
            logger.warning("LSTM scaler is not loaded. Prediction will be attempted without scaling (results likely inaccurate).")
            scaled_data = data_values
        else:
            try:
                scaled_data = lstm_scaler.transform(data_values)
                logger.info("Data scaled successfully using loaded LSTM scaler.")
            except Exception as scale_e:
                logger.error(f"Error scaling data with LSTM scaler: {scale_e}. Ensure input features match scaler's features.", exc_info=True)
                return None

        scaled_data_reshaped = scaled_data.reshape(1, SEQUENCE_LENGTH_LSTM, NUM_FEATURES_LSTM)
        logger.debug(f"Scaled and reshaped data for LSTM input shape: {scaled_data_reshaped.shape}")

        predictions = lstm_model.predict(scaled_data_reshaped)
        logger.debug(f"LSTM Raw prediction output: {predictions}")

        # Expecting (batch_size, 1) for single value regression
        if predictions is None or (predictions.ndim == 2 and predictions.shape[1] != 1) or predictions.ndim > 2 :
             logger.error(f"LSTM prediction output shape unexpected: {predictions.shape if predictions is not None else 'None'}, expected (1,1) or similar for regression"); return None

        predicted_value = float(predictions[0][0])
        logger.info(f"LSTM Predicted value (e.g., days_of_planted): {predicted_value:.2f}")

        result = {
            "predicted_value": round(predicted_value, 2)
        }
        return result

    except Exception as e:
        logger.error(f"Error predicting with LSTM model: {e}", exc_info=True)
        return None
