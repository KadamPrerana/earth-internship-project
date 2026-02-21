# ============================================================
# views.py — API Views using MongoEngine ORM/ODM
# ============================================================
# This file contains all REST API endpoint handlers for:
#   1. User CRUD operations (Create, Read, Update, Delete)
#   2. User Login/Authentication (with JWT tokens)
#   3. Token Refresh endpoint
#   4. Task CRUD operations (Create, Read, Update, Delete)
#
# ORM Methods Used:
#   CREATE → Model(fields).save()
#   READ   → Model.objects.filter() / Model.objects.get()
#   UPDATE → document.update(set__field=value)
#   DELETE → document.delete()
#
# Security:
#   - Passwords are hashed using werkzeug
#   - Task endpoints are protected with @jwt_required decorator
#   - All views have proper exception handling
# ============================================================

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User, Task
from werkzeug.security import generate_password_hash, check_password_hash
from .exceptions import ValidationError, NotFoundError, AuthenticationError, DuplicateError
from .authentication import generate_tokens, decode_token
from .decorators import jwt_required
import jwt
import re
import logging

logger = logging.getLogger(__name__)


# ============================================================
# USER APIs — CRUD using MongoEngine ORM
# ============================================================

# ----------------------------------------------------------
# CREATE USER — POST /api/users/create/
# ----------------------------------------------------------
# ORM: User(name=..., email=..., password=...).save()
# Expects JSON: { "name": "...", "email": "...", "password": "..." }
# ----------------------------------------------------------
@api_view(['POST'])
def create_user(request):
    try:
        data = request.data

        # ---- Server-Side Validation ----
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")

        # Validate: no empty fields
        if not name:
            raise ValidationError("Name is required")
        if not email:
            raise ValidationError("Email is required")
        if not password:
            raise ValidationError("Password is required")

        # Validate: name must be at least 2 characters
        if len(name) < 2:
            raise ValidationError("Name must be at least 2 characters")

        # Validate: email format using regex
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            raise ValidationError("Please enter a valid email address")

        # Validate: password strength
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters")
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter")
        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            raise ValidationError("Password must contain at least one special character")

        # ORM Query: Check if user already exists
        existing_user = User.objects(email=email).first()
        if existing_user:
            raise DuplicateError("User with this email already exists")

        # ORM: Create and save a new User document
        user = User(
            name=name,
            email=email,
            password=generate_password_hash(password),
        )
        user.save()

        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)

    except (ValidationError, DuplicateError):
        raise  # Let the custom exception handler deal with these
    except Exception as e:
        logger.error(f"Error creating user: {e}", exc_info=True)
        raise


# ----------------------------------------------------------
# READ ALL USERS — GET /api/users/list/
# ----------------------------------------------------------
# ORM: User.objects() — returns all documents
# ----------------------------------------------------------
@api_view(['GET'])
def get_users(request):
    try:
        # Optimized: .only() loads only needed fields (excludes password hash)
        # .order_by('-created_at') leverages the -created_at index
        users = User.objects().only('name', 'email', 'created_at').order_by('-created_at')
        users_list = []
        for user in users:
            users_list.append({
                "name": user.name,
                "email": user.email,
                "created_at": str(user.created_at) if user.created_at else "",
            })
        return Response(users_list)

    except Exception as e:
        logger.error(f"Error fetching users: {e}", exc_info=True)
        raise


# ----------------------------------------------------------
# UPDATE USER — PUT /api/users/update/<email>/
# ----------------------------------------------------------
# ORM: User.objects(email=email).first().update(set__name=value)
# ----------------------------------------------------------
@api_view(['PUT'])
def update_user(request, email):
    try:
        user = User.objects(email=email).first()

        if not user:
            raise NotFoundError("User not found")

        update_data = {}
        if "name" in request.data:
            update_data["set__name"] = request.data["name"]

        if update_data:
            user.update(**update_data)

        return Response({"message": "User updated successfully"})

    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}", exc_info=True)
        raise


# ----------------------------------------------------------
# DELETE USER — DELETE /api/users/delete/<email>/
# ----------------------------------------------------------
# ORM: User.objects(email=email).first().delete()
# Also deletes all associated tasks
# ----------------------------------------------------------
@api_view(['DELETE'])
def delete_user(request, email):
    try:
        user = User.objects(email=email).first()

        if not user:
            raise NotFoundError("User not found")

        # ORM Delete: Remove all tasks belonging to this user
        Task.objects(email=email).delete()

        # ORM Delete: Remove the user document
        user.delete()

        return Response({"message": "User deleted successfully"})

    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}", exc_info=True)
        raise


# ----------------------------------------------------------
# LOGIN USER — POST /api/users/login/
# ----------------------------------------------------------
# ORM: User.objects(email=email).first() — find user by email
# Returns JWT access and refresh tokens on success
# ----------------------------------------------------------
@api_view(['POST'])
def login_user(request):
    try:
        data = request.data
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise ValidationError("Email and password are required")

        # ORM Query: Find user by email
        # Optimized: .only() loads only authentication-relevant fields
        # Uses the unique email index for O(1) lookup
        user = User.objects(email=email).only('name', 'email', 'password').first()

        if not user:
            raise AuthenticationError("Invalid email or password")

        # Verify password against stored hash
        if not check_password_hash(user.password, password):
            raise AuthenticationError("Invalid email or password")

        # Generate JWT tokens
        tokens = generate_tokens(user)

        return Response({
            "message": "Login successful",
            "user": {
                "name": user.name,
                "email": user.email,
            },
            "access": tokens["access"],    # Access token (30 min)
            "refresh": tokens["refresh"],  # Refresh token (7 days)
        })

    except (ValidationError, AuthenticationError):
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}", exc_info=True)
        raise


# ----------------------------------------------------------
# REFRESH TOKEN — POST /api/users/token/refresh/
# ----------------------------------------------------------
# Accepts a refresh token, returns a new access token.
# This allows the frontend to stay logged in without
# re-entering credentials.
# ----------------------------------------------------------
@api_view(['POST'])
def refresh_token(request):
    try:
        refresh = request.data.get("refresh")

        if not refresh:
            raise ValidationError("Refresh token is required")

        # Decode the refresh token
        try:
            payload = decode_token(refresh)
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Refresh token has expired. Please login again.")
        except jwt.InvalidTokenError:
            raise AuthenticationError("Invalid refresh token.")

        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type. Refresh token required.")

        # Find the user
        user = User.objects(email=payload.get("email")).first()
        if not user:
            raise AuthenticationError("User not found")

        # Generate new tokens
        tokens = generate_tokens(user)

        return Response({
            "access": tokens["access"],
            "refresh": tokens["refresh"],
        })

    except (ValidationError, AuthenticationError):
        raise
    except Exception as e:
        logger.error(f"Error refreshing token: {e}", exc_info=True)
        raise


# ============================================================
# TASK APIs — CRUD using MongoEngine ORM
# ============================================================
# All task endpoints are protected with @jwt_required decorator.
# The decorator verifies the JWT access token from the
# Authorization header and attaches user_email to the request.
# ============================================================

# ----------------------------------------------------------
# CREATE TASK — POST /api/users/tasks/create/
# ----------------------------------------------------------
# ORM: Task(email=..., text=..., status=...).save()
# Protected: Requires valid JWT access token
# ----------------------------------------------------------
@api_view(['POST'])
def create_task(request):
    try:
        data = request.data

        if not data.get("email") or not data.get("text"):
            raise ValidationError("Email and task text are required")

        # Validate: Check if user with this email exists in the database
        # Task should only be created for registered users
        user = User.objects(email=data.get("email")).first()
        if not user:
            raise ValidationError("No user found with this email. Please register first.")

        # Status is always "Pending" when a task is first created
        # Users can change the status later via the update endpoint
        task_status = "Pending"

        # ORM: Create and save a new Task document
        task = Task(
            email=data.get("email"),
            text=data.get("text"),
            status=task_status,
            start_date=data.get("start_date", ""),
            due_date=data.get("due_date", ""),
        )
        task.save()

        return Response({
            "message": "Task created successfully",
            "task_id": str(task.id),
        }, status=status.HTTP_201_CREATED)

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {e}", exc_info=True)
        raise


# ----------------------------------------------------------
# READ TASKS — GET /api/users/tasks/list/<email>/
# ----------------------------------------------------------
# ORM: Task.objects(email=email) — filter tasks by user email
# Protected: Requires valid JWT access token
# ----------------------------------------------------------
@api_view(['GET'])
def get_tasks(request, email):
    try:
        # Optimized query:
        #   .only() — field projection, loads only needed fields
        #   .order_by('-created_at') — leverages (email, -created_at) compound index
        #   Filter on email uses the 'email' single-field index
        tasks = (
            Task.objects(email=email)
            .only('email', 'text', 'status', 'start_date', 'due_date', 'created_at')
            .order_by('-created_at')
        )

        tasks_list = []
        for task in tasks:
            tasks_list.append({
                "_id": str(task.id),
                "email": task.email,
                "text": task.text,
                "status": getattr(task, 'status', None) or "Pending",
                "start_date": getattr(task, 'start_date', None) or "",
                "due_date": getattr(task, 'due_date', None) or "",
                "created_at": str(task.created_at) if task.created_at else "",
            })

        return Response(tasks_list)

    except Exception as e:
        logger.error(f"Error fetching tasks: {e}", exc_info=True)
        raise


# ----------------------------------------------------------
# UPDATE TASK — PUT /api/users/tasks/update/<task_id>/
# ----------------------------------------------------------
# ORM: Task.objects(id=task_id).first().update(set__field=value)
# Protected: Requires valid JWT access token
# ----------------------------------------------------------
@api_view(['PUT'])
def update_task(request, task_id):
    try:
        data = request.data

        # ORM Query: Find task by its ObjectId
        task = Task.objects(id=task_id).first()

        if not task:
            raise NotFoundError("Task not found")

        # ORM Update: Build update kwargs using set__ prefix
        update_data = {}
        if "text" in data:
            update_data["set__text"] = data["text"]
        if "status" in data:
            if data["status"] in ["Pending", "In Progress", "Completed"]:
                update_data["set__status"] = data["status"]
        if "start_date" in data:
            update_data["set__start_date"] = data["start_date"]
        if "due_date" in data:
            update_data["set__due_date"] = data["due_date"]

        if update_data:
            task.update(**update_data)

        return Response({"message": "Task updated successfully"})

    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {e}", exc_info=True)
        raise


# ----------------------------------------------------------
# DELETE TASK — DELETE /api/users/tasks/delete/<task_id>/
# ----------------------------------------------------------
# ORM: Task.objects(id=task_id).first().delete()
# Protected: Requires valid JWT access token
# ----------------------------------------------------------
@api_view(['DELETE'])
def delete_task(request, task_id):
    try:
        task = Task.objects(id=task_id).first()

        if not task:
            raise NotFoundError("Task not found")

        # ORM Delete: Remove the task document from MongoDB
        task.delete()

        return Response({"message": "Task deleted successfully"})

    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {e}", exc_info=True)
        raise
