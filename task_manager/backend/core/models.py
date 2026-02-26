from mongoengine import Document, StringField, BooleanField, DateTimeField
from datetime import datetime


class User(Document):
    name = StringField(required=True, max_length=100)
    email = StringField(required=True, unique=True, max_length=255)
    password = StringField(required=True)
    role = StringField(default='user', choices=['user', 'admin'])
    is_blocked = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.now)

    meta = {
        'collection': 'users',
        'indexes': ['email', 'role'],
        'strict': False
    }

    def to_dict(self):
        return {
            '_id': str(self.id),
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'is_blocked': self.is_blocked,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Task(Document):
    title = StringField(required=True, max_length=200)
    description = StringField(default='', max_length=2000)
    status = StringField(default='Pending', choices=['Pending', 'In Progress', 'Completed'])
    priority = StringField(default='Medium', choices=['Low', 'Medium', 'High'])
    start_date = StringField(default='')
    due_date = StringField(default='')
    assigned_to = StringField(required=True)  # user email
    created_by = StringField(required=True)   # creator email
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)

    meta = {
        'collection': 'tasks',
        'indexes': [
            'assigned_to',
            'created_by',
            'status',
            'priority',
            ('assigned_to', 'status'),   # compound index
            ('assigned_to', 'priority'), # compound index
        ],
        'strict': False
    }

    def to_dict(self):
        return {
            '_id': str(self.id),
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'start_date': self.start_date,
            'due_date': self.due_date,
            'assigned_to': self.assigned_to,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ActivityLog(Document):
    user_email = StringField(required=True)
    action = StringField(required=True)
    details = StringField(default='')
    timestamp = DateTimeField(default=datetime.now)

    meta = {
        'collection': 'activity_logs',
        'indexes': ['-timestamp', 'user_email'],
        'ordering': ['-timestamp'],
        'strict': False
    }

    def to_dict(self):
        return {
            '_id': str(self.id),
            'user_email': self.user_email,
            'action': self.action,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
