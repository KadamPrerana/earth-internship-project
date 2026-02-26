import bcrypt
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponse

from core.models import User, Task, ActivityLog
from core.decorators import role_required
from core.utils import (
    validate_email, validate_password, log_activity,
    export_tasks_csv, paginate_queryset
)


@api_view(['GET'])
@role_required('admin')
def list_users(request):
    """List all users with pagination."""
    queryset = User.objects.all()

    # Search
    search = request.GET.get('search', '').strip()
    if search:
        queryset = queryset.filter(
            __raw__={'$or': [
                {'name': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}}
            ]}
        )

    # Filter by role
    role = request.GET.get('role')
    if role and role in ['user', 'admin']:
        queryset = queryset.filter(role=role)

    page = request.GET.get('page', 1)
    per_page = request.GET.get('per_page', 20)
    result = paginate_queryset(queryset, page, per_page)

    return Response({
        'users': [u.to_dict() for u in result['items']],
        'page': result['page'],
        'per_page': result['per_page'],
        'total': result['total'],
        'total_pages': result['total_pages']
    })


@api_view(['POST'])
@role_required('admin')
def create_user(request):
    """Admin creates a new user with optional role."""
    data = request.data
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'user')

    if not all([name, email, password]):
        return Response({'error': 'All fields (name, email, password) are required'}, status=400)

    if not validate_email(email):
        return Response({'error': 'Invalid email format'}, status=400)

    is_valid, msg = validate_password(password)
    if not is_valid:
        return Response({'error': msg}, status=400)

    if role not in ['user', 'admin']:
        role = 'user'

    if User.objects(email=email).first():
        return Response({'error': 'User with this email already exists'}, status=400)

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user = User(
        name=name,
        email=email,
        password=hashed.decode('utf-8'),
        role=role
    )
    user.save()

    log_activity(
        request.auth_user.email,
        'admin_created_user',
        f'Admin created user: {name} ({email}) with role: {role}'
    )

    return Response({
        'message': 'User created successfully',
        'user': user.to_dict()
    }, status=201)


@api_view(['PATCH'])
@role_required('admin')
def toggle_block_user(request, user_id):
    """Block or unblock a user."""
    user = User.objects(id=user_id).first()
    if not user:
        return Response({'error': 'User not found'}, status=404)

    if user.email == request.auth_user.email:
        return Response({'error': 'Cannot block yourself'}, status=400)

    new_status = not user.is_blocked
    user.update(set__is_blocked=new_status)
    user.reload()

    action = 'blocked' if new_status else 'unblocked'
    log_activity(
        request.auth_user.email,
        f'admin_{action}_user',
        f'Admin {action} user: {user.name} ({user.email})'
    )

    return Response({
        'message': f'User {action} successfully',
        'user': user.to_dict()
    })


@api_view(['DELETE'])
@role_required('admin')
def delete_user(request, user_id):
    """Delete a user and their tasks."""
    user = User.objects(id=user_id).first()
    if not user:
        return Response({'error': 'User not found'}, status=404)

    if user.email == request.auth_user.email:
        return Response({'error': 'Cannot delete yourself'}, status=400)

    # Delete user's tasks (cascade)
    email = user.email
    name = user.name
    Task.objects(assigned_to=email).delete()
    user.delete()

    log_activity(
        request.auth_user.email,
        'admin_deleted_user',
        f'Admin deleted user: {name} ({email}) and their tasks'
    )

    return Response({'message': 'User and their tasks deleted successfully'})


@api_view(['GET'])
@role_required('admin')
def list_all_tasks(request):
    """List all tasks with filters and pagination."""
    queryset = Task.objects.all()

    # Filters
    status = request.GET.get('status')
    if status and status in ['Pending', 'In Progress', 'Completed']:
        queryset = queryset.filter(status=status)

    priority = request.GET.get('priority')
    if priority and priority in ['Low', 'Medium', 'High']:
        queryset = queryset.filter(priority=priority)

    assigned_to = request.GET.get('assigned_to')
    if assigned_to:
        queryset = queryset.filter(assigned_to=assigned_to)

    # Search
    search = request.GET.get('search', '').strip()
    if search:
        queryset = queryset.filter(title__icontains=search)

    # Sort
    sort_by = request.GET.get('sort', '-created_at')
    queryset = queryset.order_by(sort_by)

    page = request.GET.get('page', 1)
    per_page = request.GET.get('per_page', 10)
    result = paginate_queryset(queryset, page, per_page)

    return Response({
        'tasks': [t.to_dict() for t in result['items']],
        'page': result['page'],
        'per_page': result['per_page'],
        'total': result['total'],
        'total_pages': result['total_pages']
    })


@api_view(['POST'])
@role_required('admin')
def assign_task(request):
    """Admin assigns a task to any user."""
    data = request.data
    title = data.get('title', '').strip()
    assigned_to = data.get('assigned_to', '').strip().lower()

    if not title:
        return Response({'error': 'Task title is required'}, status=400)

    if not assigned_to:
        return Response({'error': 'assigned_to (user email) is required'}, status=400)

    # Verify user exists
    target_user = User.objects(email=assigned_to).first()
    if not target_user:
        return Response({'error': 'Target user not found'}, status=400)

    # Admin can set initial status
    status = data.get('status', 'Pending')
    if status not in ['Pending', 'In Progress', 'Completed']:
        status = 'Pending'

    task = Task(
        title=title,
        description=data.get('description', '').strip(),
        status=status,
        priority=data.get('priority', 'Medium'),
        start_date=data.get('start_date', ''),
        due_date=data.get('due_date', ''),
        assigned_to=assigned_to,
        created_by=request.auth_user.email,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    if task.priority not in ['Low', 'Medium', 'High']:
        task.priority = 'Medium'

    task.save()
    log_activity(
        request.auth_user.email,
        'admin_assigned_task',
        f'Admin assigned task "{title}" to {assigned_to}'
    )

    return Response({
        'message': 'Task assigned successfully',
        'task': task.to_dict()
    }, status=201)


@api_view(['PUT'])
@role_required('admin')
def admin_update_task(request, task_id):
    """Admin can edit any task."""
    task = Task.objects(id=task_id).first()
    if not task:
        return Response({'error': 'Task not found'}, status=404)

    data = request.data
    update_fields = {}

    if 'title' in data:
        title = data['title'].strip()
        if not title:
            return Response({'error': 'Title cannot be empty'}, status=400)
        update_fields['set__title'] = title

    if 'description' in data:
        update_fields['set__description'] = data['description'].strip()

    if 'status' in data and data['status'] in ['Pending', 'In Progress', 'Completed']:
        update_fields['set__status'] = data['status']

    if 'priority' in data and data['priority'] in ['Low', 'Medium', 'High']:
        update_fields['set__priority'] = data['priority']

    if 'due_date' in data:
        update_fields['set__due_date'] = data['due_date']

    if 'start_date' in data:
        update_fields['set__start_date'] = data['start_date']

    if 'assigned_to' in data:
        assigned = data['assigned_to'].strip().lower()
        if not User.objects(email=assigned).first():
            return Response({'error': 'Target user not found'}, status=400)
        update_fields['set__assigned_to'] = assigned

    if update_fields:
        update_fields['set__updated_at'] = datetime.now()
        task.update(**update_fields)
        task.reload()
        log_activity(
            request.auth_user.email,
            'admin_updated_task',
            f'Admin updated task: {task.title}'
        )

    return Response({
        'message': 'Task updated successfully',
        'task': task.to_dict()
    })


@api_view(['DELETE'])
@role_required('admin')
def admin_delete_task(request, task_id):
    """Admin can delete any task."""
    task = Task.objects(id=task_id).first()
    if not task:
        return Response({'error': 'Task not found'}, status=404)

    title = task.title
    task.delete()
    log_activity(
        request.auth_user.email,
        'admin_deleted_task',
        f'Admin deleted task: {title}'
    )

    return Response({'message': 'Task deleted successfully'})


@api_view(['GET'])
@role_required('admin')
def analytics(request):
    """Dashboard analytics data."""
    total_users = User.objects.count()
    total_tasks = Task.objects.count()
    blocked_users = User.objects(is_blocked=True).count()

    # Task distribution by status
    status_dist = {}
    for status in ['Pending', 'In Progress', 'Completed']:
        status_dist[status] = Task.objects(status=status).count()

    # Task distribution by priority
    priority_dist = {}
    for priority in ['Low', 'Medium', 'High']:
        priority_dist[priority] = Task.objects(priority=priority).count()

    # Recent activity
    recent_logs = ActivityLog.objects.order_by('-timestamp').limit(20)

    # Top users by task count
    pipeline = [
        {'$group': {'_id': '$assigned_to', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': 5}
    ]
    top_users = list(Task.objects.aggregate(pipeline))

    return Response({
        'total_users': total_users,
        'total_tasks': total_tasks,
        'blocked_users': blocked_users,
        'status_distribution': status_dist,
        'priority_distribution': priority_dist,
        'top_users': [{'email': u['_id'], 'tasks': u['count']} for u in top_users],
        'recent_activity': [log.to_dict() for log in recent_logs]
    })


@api_view(['GET'])
@role_required('admin')
def admin_export_tasks(request):
    """Export all tasks as CSV."""
    tasks = Task.objects.all()
    task_dicts = [t.to_dict() for t in tasks]
    csv_content = export_tasks_csv(task_dicts)

    response = HttpResponse(csv_content, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="all_tasks.csv"'
    return response


@api_view(['GET'])
@role_required('admin')
def activity_logs(request):
    """View activity logs with pagination."""
    queryset = ActivityLog.objects.order_by('-timestamp')

    # Filter by user
    user_email = request.GET.get('user_email')
    if user_email:
        queryset = queryset.filter(user_email=user_email)

    # Filter by action
    action = request.GET.get('action')
    if action:
        queryset = queryset.filter(action=action)

    page = request.GET.get('page', 1)
    per_page = request.GET.get('per_page', 20)
    result = paginate_queryset(queryset, page, per_page)

    return Response({
        'logs': [log.to_dict() for log in result['items']],
        'page': result['page'],
        'per_page': result['per_page'],
        'total': result['total'],
        'total_pages': result['total_pages']
    })
