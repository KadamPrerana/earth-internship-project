"""
Unit tests for the Task Management System backend.
Uses MongoTestCase pattern for isolated MongoDB testing.
"""
import json
import jwt
import bcrypt
from datetime import datetime, timedelta
from django.test import TestCase
from rest_framework.test import APIClient
import mongoengine

from core.models import User, Task, ActivityLog


import os

JWT_SECRET = os.getenv('JWT_SECRET', 'taskmanager-secret-key-2026')
JWT_ALGORITHM = 'HS256'


def generate_test_token(email, role='user', name='Test User', expired=False):
    """Generate a JWT token for testing."""
    exp = datetime.utcnow() + (timedelta(hours=-1) if expired else timedelta(hours=24))
    payload = {'email': email, 'role': role, 'name': name, 'exp': exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def hash_password(password):
    """Hash a password with bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


class MongoTestCase(TestCase):
    """Base test case for MongoEngine-backed tests."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        mongoengine.disconnect_all()
        mongoengine.connect(db='test_taskmanager_db', host='mongodb://localhost:27017/')

    @classmethod
    def tearDownClass(cls):
        db = mongoengine.get_db()
        db.client.drop_database('test_taskmanager_db')
        mongoengine.disconnect_all()
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()
        # Clear all collections
        User.objects.delete()
        Task.objects.delete()
        ActivityLog.objects.delete()
        # Create standard test users
        self.admin_password = 'Admin@123'
        self.user_password = 'User@1234'
        self.admin = User(
            name='Admin', email='admin@test.com',
            password=hash_password(self.admin_password), role='admin'
        )
        self.admin.save()
        self.user = User(
            name='TestUser', email='user@test.com',
            password=hash_password(self.user_password), role='user'
        )
        self.user.save()
        self.admin_token = generate_test_token('admin@test.com', 'admin', 'Admin')
        self.user_token = generate_test_token('user@test.com', 'user', 'TestUser')

    def auth_header(self, token):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


# ═══════════════════════════════════════════════════════════
# AUTH TESTS
# ═══════════════════════════════════════════════════════════

class AuthTests(MongoTestCase):

    def test_register_success(self):
        resp = self.client.post('/api/auth/register/', {
            'name': 'New User', 'email': 'new@test.com', 'password': 'NewPass@1'
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertIn('token', resp.data)
        self.assertEqual(resp.data['user']['role'], 'user')

    def test_register_duplicate_email(self):
        resp = self.client.post('/api/auth/register/', {
            'name': 'Dup', 'email': 'user@test.com', 'password': 'Pass@123'
        }, format='json')
        self.assertIn(resp.status_code, [400, 409])

    def test_register_weak_password(self):
        resp = self.client.post('/api/auth/register/', {
            'name': 'Weak', 'email': 'weak@test.com', 'password': '123'
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_register_invalid_email(self):
        resp = self.client.post('/api/auth/register/', {
            'name': 'Bad', 'email': 'not-an-email', 'password': 'Pass@123'
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_login_success(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'user@test.com', 'password': self.user_password
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('token', resp.data)

    def test_login_wrong_password(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'user@test.com', 'password': 'WrongPass@1'
        }, format='json')
        self.assertEqual(resp.status_code, 401)

    def test_login_blocked_user(self):
        self.user.update(set__is_blocked=True)
        resp = self.client.post('/api/auth/login/', {
            'email': 'user@test.com', 'password': self.user_password
        }, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_get_profile(self):
        resp = self.client.get('/api/auth/profile/', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['user']['email'], 'user@test.com')

    def test_update_profile(self):
        resp = self.client.put('/api/auth/profile/update/',
            {'name': 'Updated Name'}, format='json',
            **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['user']['name'], 'Updated Name')


# ═══════════════════════════════════════════════════════════
# JWT MIDDLEWARE TESTS
# ═══════════════════════════════════════════════════════════

class JWTTests(MongoTestCase):

    def test_missing_token(self):
        resp = self.client.get('/api/auth/profile/')
        self.assertEqual(resp.status_code, 401)

    def test_expired_token(self):
        token = generate_test_token('user@test.com', expired=True)
        resp = self.client.get('/api/auth/profile/', **self.auth_header(token))
        self.assertEqual(resp.status_code, 401)

    def test_invalid_token(self):
        resp = self.client.get('/api/auth/profile/',
            HTTP_AUTHORIZATION='Bearer invalid.token.here')
        self.assertEqual(resp.status_code, 401)


# ═══════════════════════════════════════════════════════════
# TASK TESTS (User)
# ═══════════════════════════════════════════════════════════

class TaskTests(MongoTestCase):

    def test_create_task(self):
        resp = self.client.post('/api/tasks/', {
            'title': 'My Task', 'priority': 'High', 'due_date': '2026-03-01'
        }, format='json', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['task']['status'], 'Pending')
        self.assertEqual(resp.data['task']['priority'], 'High')

    def test_create_task_no_title(self):
        resp = self.client.post('/api/tasks/', {
            'title': ''
        }, format='json', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 400)

    def test_list_tasks(self):
        Task(title='T1', assigned_to='user@test.com', created_by='user@test.com').save()
        Task(title='T2', assigned_to='user@test.com', created_by='user@test.com').save()
        Task(title='Other', assigned_to='admin@test.com', created_by='admin@test.com').save()
        resp = self.client.get('/api/tasks/list/', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['total'], 2)  # Only user's tasks

    def test_filter_tasks_by_status(self):
        Task(title='Done', status='Completed', assigned_to='user@test.com', created_by='user@test.com').save()
        Task(title='Todo', status='Pending', assigned_to='user@test.com', created_by='user@test.com').save()
        resp = self.client.get('/api/tasks/list/?status=Completed', **self.auth_header(self.user_token))
        self.assertEqual(resp.data['total'], 1)

    def test_update_task(self):
        task = Task(title='Original', assigned_to='user@test.com', created_by='user@test.com')
        task.save()
        resp = self.client.put(f'/api/tasks/{task.id}/update/', {
            'title': 'Updated', 'status': 'In Progress'
        }, format='json', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['task']['title'], 'Updated')

    def test_delete_task(self):
        task = Task(title='ToDelete', assigned_to='user@test.com', created_by='user@test.com')
        task.save()
        resp = self.client.delete(f'/api/tasks/{task.id}/delete/', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 200)

    def test_complete_task(self):
        task = Task(title='Finish Me', assigned_to='user@test.com', created_by='user@test.com')
        task.save()
        resp = self.client.patch(f'/api/tasks/{task.id}/complete/', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['task']['status'], 'Completed')

    def test_cannot_access_others_task(self):
        task = Task(title='Admin Task', assigned_to='admin@test.com', created_by='admin@test.com')
        task.save()
        resp = self.client.get(f'/api/tasks/{task.id}/', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 404)

    def test_export_csv(self):
        Task(title='CSV Task', assigned_to='user@test.com', created_by='user@test.com').save()
        resp = self.client.get('/api/tasks/export/csv/', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'text/csv')


# ═══════════════════════════════════════════════════════════
# ADMIN TESTS
# ═══════════════════════════════════════════════════════════

class AdminTests(MongoTestCase):

    def test_list_users(self):
        resp = self.client.get('/api/admin/users/', **self.auth_header(self.admin_token))
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(resp.data['total'], 2)

    def test_user_cannot_access_admin(self):
        resp = self.client.get('/api/admin/users/', **self.auth_header(self.user_token))
        self.assertEqual(resp.status_code, 403)

    def test_admin_create_user(self):
        resp = self.client.post('/api/admin/users/create/', {
            'name': 'Created', 'email': 'created@test.com',
            'password': 'Create@123', 'role': 'user'
        }, format='json', **self.auth_header(self.admin_token))
        self.assertEqual(resp.status_code, 201)

    def test_block_unblock_user(self):
        resp = self.client.patch(
            f'/api/admin/users/{self.user.id}/block/',
            **self.auth_header(self.admin_token))
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['user']['is_blocked'])
        # Unblock
        resp2 = self.client.patch(
            f'/api/admin/users/{self.user.id}/block/',
            **self.auth_header(self.admin_token))
        self.assertFalse(resp2.data['user']['is_blocked'])

    def test_cannot_block_self(self):
        resp = self.client.patch(
            f'/api/admin/users/{self.admin.id}/block/',
            **self.auth_header(self.admin_token))
        self.assertEqual(resp.status_code, 400)

    def test_delete_user_cascades(self):
        Task(title='UserTask', assigned_to='user@test.com', created_by='user@test.com').save()
        resp = self.client.delete(
            f'/api/admin/users/{self.user.id}/delete/',
            **self.auth_header(self.admin_token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Task.objects(assigned_to='user@test.com').count(), 0)

    def test_admin_assign_task(self):
        resp = self.client.post('/api/admin/tasks/assign/', {
            'title': 'Assigned Task', 'assigned_to': 'user@test.com',
            'priority': 'High', 'due_date': '2026-03-15'
        }, format='json', **self.auth_header(self.admin_token))
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['task']['created_by'], 'admin@test.com')

    def test_admin_list_all_tasks(self):
        Task(title='T1', assigned_to='user@test.com', created_by='user@test.com').save()
        Task(title='T2', assigned_to='admin@test.com', created_by='admin@test.com').save()
        resp = self.client.get('/api/admin/tasks/', **self.auth_header(self.admin_token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['total'], 2)

    def test_analytics(self):
        Task(title='T1', status='Pending', priority='High',
             assigned_to='user@test.com', created_by='user@test.com').save()
        Task(title='T2', status='Completed', priority='Low',
             assigned_to='user@test.com', created_by='user@test.com').save()
        resp = self.client.get('/api/admin/analytics/', **self.auth_header(self.admin_token))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['total_tasks'], 2)
        self.assertIn('status_distribution', resp.data)
        self.assertIn('priority_distribution', resp.data)

    def test_activity_logs(self):
        resp = self.client.get('/api/admin/activity-logs/', **self.auth_header(self.admin_token))
        self.assertEqual(resp.status_code, 200)
        self.assertIn('logs', resp.data)
