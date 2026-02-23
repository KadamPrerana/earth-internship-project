import jwt
import bcrypt
import os
from datetime import datetime, timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import User
from core.utils import validate_email, validate_password, log_activity

JWT_SECRET = os.environ.get('JWT_SECRET', 'taskmanager-secret-key-2026')
JWT_ALGORITHM = 'HS256'
TOKEN_EXPIRY_HOURS = 24


def generate_token(user):
    """Generate JWT token for authenticated user."""
    payload = {
        'email': user.email,
        'role': user.role,
        'name': user.name,
        'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@api_view(['POST'])
def register(request):
    """Register a new user."""
    data = request.data
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    # Required fields
    if not all([name, email, password]):
        return Response({'error': 'All fields (name, email, password) are required'}, status=400)

    # Email validation
    if not validate_email(email):
        return Response({'error': 'Invalid email format'}, status=400)

    # Password validation
    is_valid, msg = validate_password(password)
    if not is_valid:
        return Response({'error': msg}, status=400)

    # Check duplicate
    if User.objects(email=email).first():
        return Response({'error': 'User with this email already exists'}, status=400)

    # Hash password and save
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user = User(
        name=name,
        email=email,
        password=hashed.decode('utf-8'),
        role='user'
    )
    user.save()

    token = generate_token(user)
    log_activity(email, 'user_registered', f'New user registered: {name}')

    return Response({
        'message': 'Registration successful',
        'token': token,
        'user': user.to_dict()
    }, status=201)


@api_view(['POST'])
def login(request):
    """Authenticate user and return JWT token."""
    data = request.data
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not all([email, password]):
        return Response({'error': 'Email and password are required'}, status=400)

    user = User.objects(email=email).first()
    if not user:
        return Response({'error': 'Invalid email or password'}, status=401)

    if user.is_blocked:
        return Response({'error': 'Your account has been blocked. Contact admin.'}, status=403)

    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return Response({'error': 'Invalid email or password'}, status=401)

    token = generate_token(user)
    log_activity(email, 'user_login', f'User logged in: {user.name}')

    return Response({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    })


@api_view(['GET'])
def get_profile(request):
    """Get current user's profile."""
    user = request.auth_user
    return Response({'user': user.to_dict()})


@api_view(['PUT'])
def update_profile(request):
    """Update current user's profile (name, password)."""
    user = request.auth_user
    data = request.data

    update_fields = {}

    name = data.get('name', '').strip()
    if name:
        update_fields['set__name'] = name

    new_password = data.get('password', '')
    if new_password:
        is_valid, msg = validate_password(new_password)
        if not is_valid:
            return Response({'error': msg}, status=400)
        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        update_fields['set__password'] = hashed.decode('utf-8')

    if not update_fields:
        return Response({'error': 'No fields to update'}, status=400)

    user.update(**update_fields)
    user.reload()

    log_activity(user.email, 'profile_updated', f'User updated profile: {user.name}')

    return Response({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    })
