from functools import wraps
from django.http import JsonResponse


def role_required(role):
    """
    Decorator to restrict endpoint access by user role.
    Usage: @role_required('admin')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not hasattr(request, 'auth_user'):
                return JsonResponse({'error': 'Authentication required'}, status=401)

            if request.auth_user.role != role:
                return JsonResponse(
                    {'error': f'Access denied. {role.capitalize()} role required.'},
                    status=403
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
