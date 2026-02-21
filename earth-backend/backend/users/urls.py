# ============================================================
# urls.py — URL Routing for Users App
# ============================================================
# This file maps URL patterns to their corresponding view
# functions. All URLs are prefixed with /api/users/ (set in
# the project-level urls.py).
#
# User Endpoints:
#   POST   /api/users/create/            → Create a new user
#   GET    /api/users/list/              → List all users
#   PUT    /api/users/update/<email>/    → Update user by email
#   DELETE /api/users/delete/<email>/    → Delete user by email
#   POST   /api/users/login/            → Login (returns JWT tokens)
#
# Token Endpoints:
#   POST   /api/users/token/refresh/    → Refresh JWT access token
#
# Task Endpoints (JWT Protected):
#   POST   /api/users/tasks/create/              → Create a task
#   GET    /api/users/tasks/list/<email>/         → List user's tasks
#   PUT    /api/users/tasks/update/<task_id>/     → Update a task
#   DELETE /api/users/tasks/delete/<task_id>/     → Delete a task
# ============================================================

from django.urls import path
from .views import (
    create_user, get_users, update_user, delete_user,  # User views
    login_user,                                         # Auth view
    refresh_token,                                      # Token refresh
    create_task, get_tasks, update_task, delete_task,   # Task views
)

urlpatterns = [
    # --- User Endpoints ---
    path('create/', create_user),               # POST: Register a new user
    path('list/', get_users),                    # GET: Get all users
    path('update/<str:email>/', update_user),    # PUT: Update user by email
    path('delete/<str:email>/', delete_user),    # DELETE: Delete user by email

    # --- Authentication Endpoints ---
    path('login/', login_user),                  # POST: Login with email & password
    path('token/refresh/', refresh_token),       # POST: Refresh JWT access token

    # --- Task Endpoints (JWT Protected) ---
    path('tasks/create/', create_task),                    # POST: Create a new task
    path('tasks/list/<str:email>/', get_tasks),            # GET: Get tasks for a user
    path('tasks/update/<str:task_id>/', update_task),      # PUT: Update task by ID
    path('tasks/delete/<str:task_id>/', delete_task),      # DELETE: Delete task by ID
]

