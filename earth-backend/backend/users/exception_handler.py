# ============================================================
# exception_handler.py — Custom DRF Exception Handler
# ============================================================
# This handler catches all exceptions raised in API views
# and returns consistent JSON error responses.
#
# It handles:
#   1. Custom exceptions (ValidationError, NotFoundError, etc.)
#   2. DRF built-in exceptions (ParseError, MethodNotAllowed, etc.)
#   3. MongoDB/MongoEngine errors (InvalidId, validation errors)
#   4. Unexpected errors (500 Internal Server Error)
#
# Response format:
#   {
#       "error": "Human-readable error message",
#       "status_code": 400,
#       "type": "validation_error"
#   }
# ============================================================

from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status
from bson.errors import InvalidId
from mongoengine.errors import (
    ValidationError as MongoValidationError,
    DoesNotExist,
    NotUniqueError,
)
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.

    This function is called whenever an exception is raised in a view.
    It formats all errors into a consistent JSON structure.

    Args:
        exc: The exception instance
        context: Dictionary with 'view', 'args', 'kwargs', 'request'

    Returns:
        Response object with error details
    """

    # ---- Try DRF's default handler first ----
    # This handles DRF exceptions like ParseError, MethodNotAllowed, etc.
    response = drf_exception_handler(exc, context)

    if response is not None:
        # DRF handled it — format consistently
        error_message = response.data.get('detail', str(exc))
        response.data = {
            "error": str(error_message),
            "status_code": response.status_code,
            "type": getattr(exc, 'default_code', 'error'),
        }
        return response

    # ---- Handle MongoDB InvalidId errors ----
    # This fixes the 500 error when an invalid ObjectId is passed
    if isinstance(exc, InvalidId):
        logger.warning(f"Invalid ObjectId: {exc}")
        return Response(
            {
                "error": "Invalid ID format. Must be a 24-character hex string.",
                "status_code": 400,
                "type": "invalid_id",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---- Handle MongoEngine ValidationError ----
    if isinstance(exc, MongoValidationError):
        logger.warning(f"MongoEngine validation error: {exc}")
        return Response(
            {
                "error": str(exc),
                "status_code": 400,
                "type": "validation_error",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---- Handle MongoEngine DoesNotExist ----
    if isinstance(exc, DoesNotExist):
        return Response(
            {
                "error": "Resource not found",
                "status_code": 404,
                "type": "not_found",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # ---- Handle MongoEngine NotUniqueError ----
    if isinstance(exc, NotUniqueError):
        return Response(
            {
                "error": "A record with this data already exists",
                "status_code": 409,
                "type": "duplicate_error",
            },
            status=status.HTTP_409_CONFLICT,
        )

    # ---- Handle all unexpected errors (500) ----
    logger.error(f"Unhandled exception: {type(exc).__name__}: {exc}", exc_info=True)
    return Response(
        {
            "error": "An unexpected error occurred. Please try again later.",
            "status_code": 500,
            "type": "server_error",
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
