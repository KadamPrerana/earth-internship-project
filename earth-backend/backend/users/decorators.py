# ============================================================
# decorators.py — JWT Authentication Decorator
# ============================================================
# Provides a @jwt_required decorator that protects API views.
# It verifies the JWT token from the Authorization header
# and attaches the user's email to the request object.
#
# Usage:
#   @api_view(['GET'])
#   @jwt_required
#   def my_protected_view(request):
#       email = request.user_email   # Available after JWT verification
#       ...
#
# Expected Header:
#   Authorization: Bearer <access_token>
# ============================================================

import jwt
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .authentication import decode_token
from .exceptions import AuthenticationError
import logging

logger = logging.getLogger(__name__)


def jwt_required(view_func):
    """
    Decorator that enforces JWT authentication on a view.

    Process:
      1. Extract token from 'Authorization: Bearer <token>' header
      2. Decode and validate the token
      3. Verify it's an access token (not refresh)
      4. Attach user_email to request object
      5. Call the original view function

    If any step fails, return 401 Unauthorized.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # ---- Step 1: Get Authorization header ----
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return Response(
                {
                    "error": "Authentication required. Provide 'Authorization: Bearer <token>' header.",
                    "status_code": 401,
                    "type": "authentication_error",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ---- Step 2: Extract and decode the token ----
        token = auth_header.split("Bearer ")[1]

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return Response(
                {
                    "error": "Token has expired. Please refresh your token.",
                    "status_code": 401,
                    "type": "token_expired",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return Response(
                {
                    "error": "Invalid authentication token.",
                    "status_code": 401,
                    "type": "invalid_token",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ---- Step 3: Verify it's an access token ----
        if payload.get("type") != "access":
            return Response(
                {
                    "error": "Invalid token type. Access token required.",
                    "status_code": 401,
                    "type": "invalid_token_type",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ---- Step 4: Attach user info to request ----
        request.user_email = payload.get("email")

        # ---- Step 5: Call the original view ----
        return view_func(request, *args, **kwargs)

    return wrapper
