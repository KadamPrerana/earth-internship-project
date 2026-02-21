# ============================================================
# ORM Concepts Applied:
#   1. Document Classes → MongoDB Collections
#   2. Field Definitions → Schema with types & validation
#   3. CRUD via model methods → .save(), .update(), .delete()
#   4. QuerySets → .objects.filter(), .objects.get(), etc.
#   5. Compound Indexes → Optimized queries on multiple fields
#
# Indexing Strategy:
#   - User:  email (unique) → fast login & lookup
#   - Task:  (email, status) → fast filtered queries
#            (email, -created_at) → fast sorted queries
#            email → fast task listing by user
# ============================================================



import mongoengine
from mongoengine import Document, StringField, DateTimeField, BooleanField
from datetime import datetime

# Import db.py to ensure MongoDB connection is established
import users.db


# ============================================================
# USER MODEL — Maps to the 'users' collection in MongoDB
# ============================================================
# Fields:
#   - name     : User's full name (required)
#   - email    : User's email address (required, unique)
#   - password : Hashed password string (required)
#   - created_at: Timestamp when user was created
#
# Indexes:
#   - email (unique) — login, lookup, duplicate check
#   - created_at — default ordering
#
# ORM equivalent of: CREATE TABLE users (name, email, password, created_at)
# ============================================================
class User(Document):
    name = StringField(required=True, max_length=100)          # User's full name
    email = StringField(required=True, unique=True)             # Unique email (applied as unique index in MongoDB)
    password = StringField(required=True)
    created_at = DateTimeField(default=datetime.now)

    # Meta class configures how MongoEngine handles this model
    meta = {
        'collection': 'users',
        'ordering': ['-created_at'],
        'strict': False,
        # ---- Compound Indexes ----
        # MongoEngine auto-creates a unique index for email (unique=True),
        # so we only add the created_at index here for sorted queries.
        'indexes': [
            '-created_at',                     # Sorted user listing
        ],
    }

    # String representation of the model (like Django's __str__)
    def __str__(self):
        return f"User(name={self.name}, email={self.email})"


# ============================================================
# TASK MODEL — Maps to the 'tasks' collection in MongoDB
# ============================================================
# Fields:
#   - email      : Links task to a user (foreign key concept)
#   - text       : Task description (required)
#   - status     : Task status — "Pending" / "In Progress" / "Completed"
#   - start_date : When the task starts (optional)
#   - due_date   : When the task is due (optional)
#   - created_at : Timestamp when task was created
#
# Indexes:
#   - email             — list all tasks for a user
#   - (email, status)   — filter tasks by user + status
#   - (email, -created_at) — list tasks sorted by newest first
#   - (email, due_date) — sort/filter tasks by due date
#
# ORM equivalent of: CREATE TABLE tasks (email, text, status, start_date, due_date, created_at)
# ============================================================
class Task(Document):
    email = StringField(required=True)                          # User's email (links task to user)
    text = StringField(required=True, max_length=500)           # Task description
    status = StringField(
        default='Pending',
        choices=['Pending', 'In Progress', 'Completed']
    )
    start_date = StringField(default='')
    due_date = StringField(default='')
    created_at = DateTimeField(default=datetime.now)

    # Meta class configures how MongoEngine handles this model
    meta = {
        'collection': 'tasks',
        'ordering': ['-created_at'],          # Default ordering: newest first
        'strict': False,                      # Allow old docs with extra/missing fields
        # ---- Compound Indexes ----
        # These indexes speed up the most common queries:
        #   1. Task.objects(email=email)                → uses 'email' index
        #   2. Task.objects(email=email, status=status) → uses compound (email, status)
        #   3. Task.objects(email=email).order_by('-created_at') → uses compound (email, -created_at)
        #   4. Task.objects(email=email).order_by('due_date')   → uses compound (email, due_date)
        'indexes': [
            'email',                           # Single-field: task listing by user
            ('email', 'status'),               # Compound: filter by user + status
            ('email', '-created_at'),          # Compound: user's tasks sorted newest first
            ('email', 'due_date'),             # Compound: user's tasks sorted by due date
        ],
    }

    # String representation of the model
    def __str__(self):
        return f"Task(text={self.text}, status={self.status}, user={self.email})"
