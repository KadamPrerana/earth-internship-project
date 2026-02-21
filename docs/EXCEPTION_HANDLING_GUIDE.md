# Exception Handling Guide

## Overview

All API views have centralized exception handling through a custom DRF exception handler. Errors are returned in a consistent JSON format.

---

## Error Response Format

All errors follow this structure:
```json
{
    "error": "Human-readable error message",
    "status_code": 400,
    "type": "validation_error"
}
```

---

## Custom Exception Classes

Defined in `users/exceptions.py`:

| Exception | Status Code | Usage |
|-----------|------------|-------|
| `ValidationError` | 400 | Missing fields, invalid format, weak password |
| `NotFoundError` | 404 | User/task not found |
| `AuthenticationError` | 401 | Wrong password, invalid/expired JWT |
| `DuplicateError` | 409 | User with email already exists |

### Usage in views:
```python
from .exceptions import ValidationError, NotFoundError

@api_view(['POST'])
def my_view(request):
    if not request.data.get("email"):
        raise ValidationError("Email is required")
```

---

## Custom Exception Handler

Defined in `users/exception_handler.py`, registered in `settings.py`:
```python
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'users.exception_handler.custom_exception_handler',
}
```

### What it catches:

| Error Type | Example | HTTP Code |
|-----------|---------|-----------|
| Custom exceptions | `raise ValidationError(...)` | 400/401/404/409 |
| DRF exceptions | `MethodNotAllowed`, `ParseError` | Varies |
| `InvalidId` (bson) | Bad MongoDB ObjectId | 400 |
| `MongoValidationError` | MongoEngine schema errors | 400 |
| `NotUniqueError` | Duplicate unique field | 409 |
| Unhandled exceptions | Any uncaught error | 500 |

---

## View Exception Pattern

All views follow this pattern:
```python
@api_view(['POST'])
def my_view(request):
    try:
        # ... business logic ...
        if not valid:
            raise ValidationError("Something is wrong")
        return Response({"message": "Success"})
    except (ValidationError, NotFoundError):
        raise  # Re-raise for the custom handler
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise  # Handler returns 500
```
