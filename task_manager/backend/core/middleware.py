import jwt
import os
from django.http import JsonResponse
from core.models import User


JWT_SECRET = os.environ.get('JWT_SECRET', 'taskmanager-secret-key-2026')
JWT_ALGORITHM = 'HS256'

# Paths that don't require authentication
PUBLIC_PATHS = [
    '/api/auth/register/',
    '/api/auth/login/',
]


class JWTAuthMiddleware:
    """
    JWT Authentication Middleware.
    Extracts and validates JWT token from Authorization header.
    Attaches user object to request for downstream views.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip auth for public endpoints and OPTIONS (CORS preflight)
        if request.method == 'OPTIONS':
            return self.get_response(request)

        if any(path in request.path for path in PUBLIC_PATHS):
            return self.get_response(request)

        # Skip auth for non-API paths (admin panel, static files, etc.)
        if '/api/' not in request.path:
            return self.get_response(request)

        # Extract token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION') or request.META.get('HTTP_X_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse(
                {'error': 'Authentication required. Provide Bearer token.'},
                status=401
            )

        token = auth_header.split('Bearer ')[1]

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user = User.objects(email=payload.get('email')).first()

            if not user:
                return JsonResponse({'error': 'User not found'}, status=401)

            if user.is_blocked:
                return JsonResponse(
                    {'error': 'Your account has been blocked. Contact admin.'},
                    status=403
                )

            # Attach user to request
            request.auth_user = user

        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        return self.get_response(request)
