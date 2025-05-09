# backend/ml_models/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
# Import prediction functions - UPDATED predict_lstm_ripeness to predict_lstm_value
from .services import predict_disease, predict_yolo_objects, predict_lstm_value
# Import SensorReading model to fetch data for LSTM
from readings.models import SensorReading
# Import constants for LSTM input preparation
from .services import SEQUENCE_LENGTH_LSTM, FEATURE_COLUMNS_LSTM_ACTUAL
import pandas as pd # For creating DataFrame for LSTM
import logging

logger = logging.getLogger(__name__)

class DiseaseDetectionView(APIView):
    """API View for disease prediction."""
    parser_classes = (MultiPartParser, FormParser)
    def post(self, request, *args, **kwargs):
        logger.info(f"Received request for disease detection. Files: {request.FILES.keys()}")
        image_file = request.FILES.get('image')
        if not image_file:
            logger.warning("No image file found in disease detection request.")
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
             logger.warning(f"Invalid image file type for disease detection: {image_file.content_type}")
             return Response({"error": f"Invalid file type. Allowed: {', '.join(allowed_types)}"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            prediction_result = predict_disease(image_file)
            if prediction_result is None:
                logger.error("Disease prediction service failed.")
                return Response({"error": "Failed to process image or run disease prediction."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            logger.info(f"Disease prediction successful: {prediction_result}")
            return Response(prediction_result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Unexpected error in DiseaseDetectionView: {e}", exc_info=True)
            return Response({"error": "An unexpected server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class YoloPredictionView(APIView):
    """API View for YOLO object detections."""
    parser_classes = (MultiPartParser, FormParser)
    def post(self, request, *args, **kwargs):
        logger.info(f"Received request for YOLO prediction. Files: {request.FILES.keys()}")
        image_file = request.FILES.get('image')
        if not image_file:
            logger.warning("No image file found in YOLO request.")
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
             logger.warning(f"Invalid image file type for YOLO: {image_file.content_type}")
             return Response({"error": f"Invalid file type. Allowed types: {', '.join(allowed_types)}"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            detection_results = predict_yolo_objects(image_file)
            if detection_results is None:
                logger.error("YOLO prediction service failed or model not available.")
                return Response({"error": "Failed to process image or run YOLO prediction."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            logger.info(f"YOLO prediction successful: Found {len(detection_results)} objects.")
            return Response({"detections": detection_results}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Unexpected error in YoloPredictionView: {e}", exc_info=True)
            return Response({"error": "An unexpected server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- LSTM Prediction View (Using predict_lstm_value) ---
class LstmPredictionView(APIView):
    """
    API View for LSTM-based prediction (e.g., days_of_planted).
    Fetches the latest sensor data sequence and returns a prediction.
    This view is triggered by a GET request.
    """
    def get(self, request, *args, **kwargs):
        logger.info("Received request for LSTM prediction.")
        try:
            # 1. Fetch the last SEQUENCE_LENGTH_LSTM sensor readings
            recent_readings_qs = SensorReading.objects.order_by('-timestamp')[:SEQUENCE_LENGTH_LSTM]

            if len(recent_readings_qs) < SEQUENCE_LENGTH_LSTM:
                logger.warning(f"Not enough sensor readings available ({len(recent_readings_qs)}) to form a sequence of length {SEQUENCE_LENGTH_LSTM}.")
                return Response(
                    {"error": f"Not enough data. Need {SEQUENCE_LENGTH_LSTM} readings, found {len(recent_readings_qs)}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Convert to Pandas DataFrame and select/order features
            data_for_df = list(recent_readings_qs)[::-1] # Reverse to get oldest first
            df_data_list = []
            for reading in data_for_df:
                row = {}
                for feature_name in FEATURE_COLUMNS_LSTM_ACTUAL:
                    value = getattr(reading, feature_name, None)
                    if value is None:
                        logger.warning(f"Missing value for LSTM feature '{feature_name}' in reading ID {reading.id}. Using 0.0 as placeholder.")
                        row[feature_name] = 0.0
                    else:
                        row[feature_name] = float(value)
                df_data_list.append(row)
            
            sensor_data_df = pd.DataFrame(df_data_list, columns=FEATURE_COLUMNS_LSTM_ACTUAL)
            for col in FEATURE_COLUMNS_LSTM_ACTUAL: # Ensure numeric
                sensor_data_df[col] = pd.to_numeric(sensor_data_df[col], errors='coerce').fillna(0.0)
            logger.debug(f"DataFrame for LSTM input (shape: {sensor_data_df.shape}):\n{sensor_data_df.head()}")

            # 3. Call the prediction service (UPDATED function name)
            prediction_result = predict_lstm_value(sensor_data_df) # <--- CHANGED HERE

            if prediction_result is None:
                logger.error("LSTM prediction service failed.")
                return Response(
                    {"error": "Failed to run LSTM prediction. Check server logs for model/scaler issues or data errors."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            logger.info(f"LSTM prediction successful: {prediction_result}")
            return Response(prediction_result, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Unexpected error in LstmPredictionView: {e}", exc_info=True)
            return Response(
                {"error": "An unexpected server error occurred during LSTM prediction."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

