# backend/readings/utils.py

import os
import logging
from django.conf import settings
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

# Get an instance of a logger
logger = logging.getLogger(__name__)

# def send_alert_sms(alert):
#     """
#     Sends an SMS notification for a given Alert object using Twilio.
#     """
#     # Retrieve credentials and numbers from environment variables
#     account_sid = os.getenv('TWILIO_ACCOUNT_SID')
#     auth_token = os.getenv('TWILIO_AUTH_TOKEN')
#     twilio_phone_number = os.getenv('TWILIO_PHONE_NUMBER')
#     recipient_phone_number = os.getenv('ALERT_SMS_RECIPIENT')

#     # --- REMOVED TEMPORARY DEBUG PRINTS ---

#     # Validate that all required settings are present
#     if not all([account_sid, auth_token, twilio_phone_number, recipient_phone_number]):
#         logger.error("Twilio credentials or recipient number missing in environment variables. Cannot send SMS.")
#         # Optional: Print which one specifically might be missing if needed for future debugging
#         # if not account_sid: print("DEBUG utils.py: Missing TWILIO_ACCOUNT_SID")
#         # ... etc ...
#         return

#     # Construct the SMS message body (keep it concise for SMS)
#     sms_body = f"GrowVision Alert: {alert.sensor_key.replace('_', ' ').title()} " \
#                f"{alert.threshold_type} threshold ({alert.threshold_value:.1f}) " \
#                f"breached. Value: {alert.trigger_value:.1f}. " \
#                f"Time: {alert.timestamp.strftime('%H:%M')}"

#     try:
#         # Initialize the Twilio client
#         client = Client(account_sid, auth_token)

#         # Send the message
#         message = client.messages.create(
#             body=sms_body,
#             from_=twilio_phone_number, # Your Twilio number
#             to=recipient_phone_number   # The recipient's number
#         )

#         logger.info(f"Successfully sent alert SMS for Alert ID {alert.id} to {recipient_phone_number}. SID: {message.sid}")
#         # Also print to console for immediate feedback during development
#         print(f"--- SMS Sent Successfully to {recipient_phone_number} (SID: {message.sid}) ---")


#     except TwilioRestException as e:
#         # Log Twilio specific errors
#         logger.error(f"Twilio error sending SMS for Alert ID {alert.id}: {e}", exc_info=True)
#         # Print error to console as well
#         print(f"--- ERROR Sending SMS (Twilio): {e} ---")
#     except Exception as e:
#         # Log other potential errors
#         logger.error(f"Failed to send alert SMS for Alert ID {alert.id}: {e}", exc_info=True)
#         print(f"--- ERROR Sending SMS (General): {e} ---")

