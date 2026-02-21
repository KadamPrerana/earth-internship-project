# ============================================================
# exceptions.py — Custom Exception Classes
# ============================================================
# These exceptions provide clear, consistent error handling
# across all API views. Each exception maps to a specific
# HTTP status code.
#
# Usage in views:
#   raise ValidationError("Email is required")
#   raise NotFoundError("User not found")
#   raise AuthenticationError("Invalid token")
#   raise DuplicateError("User already exists")
# ============================================================

from rest_framework.exceptions import APIException
from rest_framework import status


class ValidationError(APIException):
    """
    400 Bad Request — raised when request data fails validation.
    Examples: missing fields, invalid email format, weak password.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid input data"
    default_code = "validation_error"


class NotFoundError(APIException):
    """
    404 Not Found — raised when a requested resource doesn't exist.
    Examples: user not found, task not found.
    """
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Resource not found"
    default_code = "not_found"


class AuthenticationError(APIException):
    """
    401 Unauthorized — raised when authentication fails.
    Examples: wrong password, invalid/expired JWT token.
    """
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Authentication failed"
    default_code = "authentication_error"


class DuplicateError(APIException):
    """
    409 Conflict — raised when trying to create a duplicate resource.
    Examples: user with email already exists.
    """
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Resource already exists"
    default_code = "duplicate_error"
