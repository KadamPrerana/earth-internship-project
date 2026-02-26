"""
Django settings for taskmanager project.
Smart Role-Based Task Management System
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-=_n$hxon^xns%ozno3dv32cd@juz_srak(d+lq@z#ljrjjb_3e'
)

DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ['*']

# ── Application Definition ───────────────────────────────
INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",       # MUST be first
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "core.middleware.JWTAuthMiddleware",            # Custom JWT auth
]

ROOT_URLCONF = "taskmanager.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
            ],
        },
    },
]

WSGI_APPLICATION = "taskmanager.wsgi.application"

# ── Database ─────────────────────────────────────────────
# MongoDB data is handled by MongoEngine (see core/db.py).
# A dummy sqlite3 in-memory DB is required for Django's test runner.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# ── CORS ──────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ── REST Framework ────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
    'UNAUTHENTICATED_USER': None,
}

# ── Internationalization ──────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = False

STATIC_URL = "static/"

# ── JWT Configuration ────────────────────────────────────
JWT_SECRET = os.environ.get('JWT_SECRET', 'taskmanager-secret-key-2026')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24
