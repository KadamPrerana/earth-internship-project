# ============================================================
# authentication.py — JWT Token Generation & Validation
# ============================================================
# Provides JWT (JSON Web Token) authentication for the API.
# Uses PyJWT library since djangorestframework-simplejwt requires
# Django's default User model (we use MongoEngine).
#
# Token Types:
#   - Access Token:  Short-lived (30 min), used for API requests
#   - Refresh Token: Long-lived (7 days), used to get new access tokens
#
# Functions:
#   generate_tokens(user) → {"access": "...", "refresh": "..."}
#   decode_token(token)   → {"email": "...", "type": "access", ...}
# ============================================================

import jwt
import datetime
from django.conf import settings


# Token expiry durations
ACCESS_TOKEN_EXPIRY = datetime.timedelta(minutes=15)      # Access: 15 minutes
REFRESH_TOKEN_EXPIRY = datetime.timedelta(days=7)          # Refresh: 7 days

# Algorithm used for signing tokens
ALGORITHM = "HS256"


def generate_tokens(user):
    """
    Generate access and refresh JWT tokens for a user.

    Args:
        user: MongoEngine User document with 'email' and 'name' fields

    Returns:
        dict: {"access": "<access_token>", "refresh": "<refresh_token>"}

    Example:
        tokens = generate_tokens(user)
        # tokens = {
        #     "access": "eyJhbGciOi...",
        #     "refresh": "eyJhbGciOi..."
        # }
    """
    now = datetime.datetime.utcnow()

    # ---- Access Token Payload ----
    access_payload = {
        "email": user.email,              # User identifier
        "name": user.name,                # User's name
        "type": "access",                 # Token type
        "iat": now,                       # Issued at
        "exp": now + ACCESS_TOKEN_EXPIRY, # Expiration time
    }

    # ---- Refresh Token Payload ----
    refresh_payload = {
        "email": user.email,
        "type": "refresh",
        "iat": now,
        "exp": now + REFRESH_TOKEN_EXPIRY,
    }

    # Sign tokens using Django's SECRET_KEY
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access": access_token,
        "refresh": refresh_token,
    }


def decode_token(token):
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string

    Returns:
        dict: Decoded payload (email, type, iat, exp)

    Raises:
        jwt.ExpiredSignatureError: If token has expired
        jwt.InvalidTokenError: If token is malformed or invalid
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
