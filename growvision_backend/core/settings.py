import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-ay^7q=4_qstig0i&lhtsow(q!n@w%-3xhu#d0q5^hueo$hs)&h'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'readings',
    'ml_models' 
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MQTT_SETTINGS = {
    'MQTT_BROKER_HOST': '71050d0845fc448b9735923211f728af.s1.eu.hivemq.cloud',
    'MQTT_BROKER_PORT': 8883,
    'MQTT_USERNAME': 'lioomr',
    'MQTT_PASSWORD': 'Iot12345', # Use environment variables in production!
    'MQTT_KEEPALIVE': 60,
    'MQTT_TLS_ENABLED': True, # Important for port 8883
    'MQTT_SUB_TOPIC': 'sensor/data',
    'MQTT_CLIENT_ID': 'django_backend_client' # Or generate dynamically
}

ALERT_THRESHOLDS = {
    'temperature_c': {
        'min': 18.0,
        'max': 30.0, # Example: Alert if temp goes below 18 or above 30
        'message': 'Temperature is {value:.1f}°C, outside the safe range ({min}°C - {max}°C).'
    },
    'humidity_percent': {
        'min': 45.0,
        'max': 80.0, # Example: Alert if humidity is outside 45-80%
        'message': 'Humidity is {value:.1f}%, outside the safe range ({min}% - {max}%).'
    },
    'moisture_percent': {
        'min': 25.0, # Example: Alert if soil moisture drops below 25%
        'message': 'Soil moisture is low at {value:.1f}% (threshold: >{min}%).'
    },
    'ph_value': {
        'min': 5.8,
        'max': 7.2, # Example: Alert if pH is outside 5.8-7.2
        'message': 'pH level is {value:.2f}, outside the safe range ({min} - {max}).'
    },
    'gas_ppm': {
        'max': 1200, # Example: Alert if gas concentration exceeds 1200 ppm
        'message': 'Gas concentration is high at {value:.0f} ppm (threshold: <{max} ppm).'
    },
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  
    "http://127.0.0.1:3000", 
    
]