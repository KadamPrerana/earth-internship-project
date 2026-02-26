from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponse

from core.models import Task
from core.utils import log_activity, export_tasks_csv, paginate_queryset


@api_view(['POST'])
def create_task(request):
    """Create a new personal task."""
    user = request.auth_user
    data = request.data

    title = data.get('title', '').strip()
    if not title:
        return Response({'error': 'Task title is required'}, status=400)

    task = Task(
        title=title,
        description=data.get('description', '').strip(),
        status='Pending',  # Force pending on creation
        priority=data.get('priority', 'Medium'),
        start_date=data.get('start_date', ''),
        due_date=data.get('due_date', ''),
        assigned_to=user.email,
        created_by=user.email,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    # Validate priority
    if task.priority not in ['Low', 'Medium', 'High']:
        task.priority = 'Medium'

    task.save()
    log_activity(user.email, 'task_created', f'Created task: {title}')

    return Response({
        'message': 'Task created successfully',
        'task': task.to_dict()
    }, status=201)


@api_view(['GET'])
def list_tasks(request):
    """List current user's tasks with filtering, search, and pagination."""
    user = request.auth_user
    queryset = Task.objects(assigned_to=user.email)

    # Filters
    status = request.GET.get('status')
    if status and status in ['Pending', 'In Progress', 'Completed']:
        queryset = queryset.filter(status=status)

    priority = request.GET.get('priority')
    if priority and priority in ['Low', 'Medium', 'High']:
        queryset = queryset.filter(priority=priority)

    # Search
    search = request.GET.get('search', '').strip()
    if search:
        queryset = queryset.filter(title__icontains=search)

    # Sort
    sort_by = request.GET.get('sort', '-created_at')
    if sort_by in ['created_at', '-created_at', 'due_date', '-due_date', 'priority', '-priority']:
        queryset = queryset.order_by(sort_by)
    else:
        queryset = queryset.order_by('-created_at')

    # Pagination
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


@api_view(['GET'])
def get_task(request, task_id):
    """Get a single task (must belong to user)."""
    user = request.auth_user
    task = Task.objects(id=task_id, assigned_to=user.email).first()

    if not task:
        return Response({'error': 'Task not found'}, status=404)

    return Response({'task': task.to_dict()})


@api_view(['PUT'])
def update_task(request, task_id):
    """Update user's own task."""
    user = request.auth_user
    task = Task.objects(id=task_id, assigned_to=user.email).first()

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

    if 'status' in data:
        if data['status'] in ['Pending', 'In Progress', 'Completed']:
            update_fields['set__status'] = data['status']

    if 'priority' in data:
        if data['priority'] in ['Low', 'Medium', 'High']:
            update_fields['set__priority'] = data['priority']

    if 'due_date' in data:
        update_fields['set__due_date'] = data['due_date']

    if 'start_date' in data:
        update_fields['set__start_date'] = data['start_date']

    if update_fields:
        update_fields['set__updated_at'] = datetime.now()
        task.update(**update_fields)
        task.reload()
        log_activity(user.email, 'task_updated', f'Updated task: {task.title}')

    return Response({
        'message': 'Task updated successfully',
        'task': task.to_dict()
    })


@api_view(['DELETE'])
def delete_task(request, task_id):
    """Delete user's own task."""
    user = request.auth_user
    task = Task.objects(id=task_id, assigned_to=user.email).first()

    if not task:
        return Response({'error': 'Task not found'}, status=404)

    title = task.title
    task.delete()
    log_activity(user.email, 'task_deleted', f'Deleted task: {title}')

    return Response({'message': 'Task deleted successfully'})


@api_view(['PATCH'])
def complete_task(request, task_id):
    """Mark task as completed."""
    user = request.auth_user
    task = Task.objects(id=task_id, assigned_to=user.email).first()

    if not task:
        return Response({'error': 'Task not found'}, status=404)

    task.update(set__status='Completed', set__updated_at=datetime.now())
    task.reload()
    log_activity(user.email, 'task_completed', f'Completed task: {task.title}')

    return Response({
        'message': 'Task marked as completed',
        'task': task.to_dict()
    })


@api_view(['GET'])
def export_tasks(request):
    """Export user's tasks as CSV."""
    user = request.auth_user
    tasks = Task.objects(assigned_to=user.email)
    task_dicts = [t.to_dict() for t in tasks]
    csv_content = export_tasks_csv(task_dicts)

    response = HttpResponse(csv_content, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="my_tasks.csv"'
    return response
