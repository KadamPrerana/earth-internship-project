from django.urls import path
from core.views import auth_views, task_views, admin_views

urlpatterns = [
    # ── Auth ──────────────────────────────────────────
    path('api/auth/register/', auth_views.register),
    path('api/auth/login/', auth_views.login),
    path('api/auth/profile/', auth_views.get_profile),
    path('api/auth/profile/update/', auth_views.update_profile),

    # ── User Tasks ────────────────────────────────────
    path('api/tasks/', task_views.create_task),            # POST
    path('api/tasks/list/', task_views.list_tasks),        # GET
    path('api/tasks/export/csv/', task_views.export_tasks),# GET
    path('api/tasks/<str:task_id>/', task_views.get_task),            # GET
    path('api/tasks/<str:task_id>/update/', task_views.update_task),  # PUT
    path('api/tasks/<str:task_id>/delete/', task_views.delete_task),  # DELETE
    path('api/tasks/<str:task_id>/complete/', task_views.complete_task),  # PATCH

    # ── Admin ─────────────────────────────────────────
    path('api/admin/users/', admin_views.list_users),           # GET
    path('api/admin/users/create/', admin_views.create_user),   # POST
    path('api/admin/users/<str:user_id>/block/', admin_views.toggle_block_user),  # PATCH
    path('api/admin/users/<str:user_id>/delete/', admin_views.delete_user),       # DELETE
    path('api/admin/tasks/', admin_views.list_all_tasks),       # GET
    path('api/admin/tasks/assign/', admin_views.assign_task),   # POST
    path('api/admin/tasks/export/csv/', admin_views.admin_export_tasks),  # GET
    path('api/admin/tasks/<str:task_id>/update/', admin_views.admin_update_task),  # PUT
    path('api/admin/tasks/<str:task_id>/delete/', admin_views.admin_delete_task),  # DELETE
    path('api/admin/analytics/', admin_views.analytics),        # GET
    path('api/admin/activity-logs/', admin_views.activity_logs),  # GET
]
