"""
Django settings for the devdebate project.

This configuration is intentionally lightweight and geared toward hackathon
prototyping. It includes CORS support so that a front‑end running on a
different port can communicate with the Django API. To use it in production
you should review Django's deployment checklist and strengthen the secret
key, allowed hosts and other security settings.

Environment variables are loaded via python‑dotenv when available. Put
sensitive keys such as OPENAI_API_KEY, ELEVENLABS_API_KEY and DJANGO_SECRET_KEY
into a ``.env`` file in the project root. See ``.env.example`` for guidance.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Load variables from .env if present
load_dotenv()


# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-default-secret-key")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG: bool = os.getenv("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes")

# Allow all hosts during development; override in production via env
ALLOWED_HOSTS: List[str] = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third‑party apps
    "corsheaders",
    # Local apps
    "api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "devdebate.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "devdebate.wsgi.application"

# Database
# By default this uses SQLite for zero‑config ease of use. You can swap to
# PostgreSQL or another database by updating DATABASES via environment vars.
DATABASES = {
    "default": {
        "ENGINE": os.getenv("DJANGO_DB_ENGINE", "django.db.backends.sqlite3"),
        "NAME": os.getenv("DJANGO_DB_NAME", str(BASE_DIR / "db.sqlite3")),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

# Media files (for storing generated audio)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS (Cross‑origin resource sharing) configuration. During local development
# the React app typically runs on http://localhost:5173 or http://localhost:3000.
CORS_ALLOWED_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True

"""
Messaging
---------

The backend will communicate with external services (OpenAI, ElevenLabs) to
generate debate rebuttals and convert text to speech. Their API keys should be
set via environment variables OPENAI_API_KEY and ELEVENLABS_API_KEY. See
``api/views.py`` for details.
"""