import re
import csv
import io
from datetime import datetime


def validate_email(email):
    """Validate email format using regex."""
    pattern = r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$'
    return bool(re.match(pattern, email))


def validate_password(password):
    """
    Password must be at least 8 chars with:
    - 1 uppercase, 1 lowercase, 1 digit, 1 special char
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    if not re.search(r'[@$!%*?&]', password):
        return False, "Password must contain at least one special character (@$!%*?&)"
    return True, "Valid"


def log_activity(user_email, action, details=''):
    """Log an activity to the ActivityLog collection."""
    from core.models import ActivityLog
    ActivityLog(
        user_email=user_email,
        action=action,
        details=details,
        timestamp=datetime.now()
    ).save()


def export_tasks_csv(tasks):
    """Export a list of task dicts to CSV string."""
    output = io.StringIO()
    if not tasks:
        return output.getvalue()

    fieldnames = ['_id', 'title', 'description', 'status', 'priority',
                  'due_date', 'assigned_to', 'created_by', 'created_at']
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    for task in tasks:
        writer.writerow(task)
    return output.getvalue()


def paginate_queryset(queryset, page=1, per_page=10):
    """Paginate a MongoEngine queryset."""
    page = max(1, int(page))
    per_page = min(max(1, int(per_page)), 100)
    total = queryset.count()
    items = queryset.skip((page - 1) * per_page).limit(per_page)
    return {
        'items': list(items),
        'page': page,
        'per_page': per_page,
        'total': total,
        'total_pages': (total + per_page - 1) // per_page
    }
