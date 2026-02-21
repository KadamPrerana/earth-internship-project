# ============================================================
# tests.py — Django Unit Tests for User and Task APIs
# ============================================================
# What: Unit tests for all CRUD operations on Users and Tasks
# How:  Uses Django REST Framework's APIClient to send HTTP
#       requests and verify responses
# Why:  Automated tests catch bugs early, ensure APIs return
#       correct status codes and data, and prevent regressions
#
# Test Database:
#   Uses a separate 'test_intern_db' database so tests don't
#   affect your real data. The database is cleaned up after tests.
#
# Run:  python3 manage.py test users -v 2
# ============================================================

from rest_framework.test import APIClient
from django.test import TestCase, override_settings
import mongoengine
from users.models import User, Task
from werkzeug.security import generate_password_hash


class BaseTestCase(TestCase):
    """
    Base test class that connects to a separate test database.
    
    Why a separate database?
      - Tests create/delete data freely without affecting real data
      - Each test starts with a clean slate
      - The test database is dropped after all tests complete
    """

    @classmethod
    def setUpClass(cls):
        """Connect to the test database before any tests run."""
        super().setUpClass()
        # Disconnect from the default database
        mongoengine.disconnect_all()
        # Connect to a separate test database
        mongoengine.connect(
            db='test_intern_db',
            host='mongodb://localhost:27017/',
            alias='default'
        )

    @classmethod
    def tearDownClass(cls):
        """Drop the test database and disconnect after all tests."""
        # Drop the entire test database to clean up
        db = mongoengine.get_db()
        db.client.drop_database('test_intern_db')
        mongoengine.disconnect_all()
        super().tearDownClass()

    def setUp(self):
        """Clean all collections before each test (fresh start)."""
        self.client = APIClient()
        # Clear all documents from both collections
        User.objects.delete()
        Task.objects.delete()


# ============================================================
# USER API TESTS
# ============================================================
class UserAPITests(BaseTestCase):
    """
    Tests for User CRUD operations:
      - POST /api/users/create/     (Create)
      - GET  /api/users/list/       (Read)
      - PUT  /api/users/update/     (Update)
      - DELETE /api/users/delete/   (Delete)
      - POST /api/users/login/      (Authentication)
    """

    def test_create_user_success(self):
        """
        Test: Creating a user with valid data returns 201 Created.
        Why:  Verifies the signup endpoint works correctly.
        """
        response = self.client.post('/api/users/create/', {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'Test@1234',                # Meets all password rules
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['message'], 'User created successfully')

        # Verify user was actually saved in the database (ORM query)
        user = User.objects(email='test@example.com').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.name, 'Test User')

    def test_create_user_duplicate_email(self):
        """
        Test: Creating a user with an existing email returns 400.
        Why:  Prevents duplicate accounts with the same email.
        """
        # Create first user
        self.client.post('/api/users/create/', {
            'name': 'User One',
            'email': 'duplicate@example.com',
            'password': 'Test@1234',
        }, format='json')

        # Try to create another user with the same email
        response = self.client.post('/api/users/create/', {
            'name': 'User Two',
            'email': 'duplicate@example.com',
            'password': 'Test@5678',
        }, format='json')

        # Should return 400 (our validation) or 409 (MongoEngine unique constraint)
        self.assertIn(response.status_code, [400, 409])

    def test_create_user_invalid_email(self):
        """
        Test: Creating a user with invalid email format returns 400.
        Why:  Email validation should reject malformed addresses.
        """
        response = self.client.post('/api/users/create/', {
            'name': 'Bad Email',
            'email': 'not-an-email',               # Missing @ and domain
            'password': 'Test@1234',
        }, format='json')

        self.assertEqual(response.status_code, 400)

    def test_create_user_weak_password(self):
        """
        Test: Creating a user with a weak password returns 400.
        Why:  Password must have uppercase, lowercase, number, special char.
        """
        # Password without special character
        response = self.client.post('/api/users/create/', {
            'name': 'Weak Pass',
            'email': 'weak@example.com',
            'password': 'Abcdefg1',                 # No special character
        }, format='json')

        self.assertEqual(response.status_code, 400)

    def test_create_user_empty_fields(self):
        """
        Test: Creating a user with empty fields returns 400.
        Why:  No empty fields should be allowed.
        """
        response = self.client.post('/api/users/create/', {
            'name': '',
            'email': '',
            'password': '',
        }, format='json')

        self.assertEqual(response.status_code, 400)

    def test_login_success(self):
        """
        Test: Logging in with correct credentials returns 200.
        Why:  Verifies authentication works and returns user info.
        """
        # First create a user
        self.client.post('/api/users/create/', {
            'name': 'Login Test',
            'email': 'login@example.com',
            'password': 'Login@123',
        }, format='json')

        # Then try to login
        response = self.client.post('/api/users/login/', {
            'email': 'login@example.com',
            'password': 'Login@123',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['email'], 'login@example.com')
        self.assertEqual(response.data['user']['name'], 'Login Test')

    def test_login_wrong_password(self):
        """
        Test: Logging in with wrong password returns 401.
        Why:  Incorrect passwords must be rejected.
        """
        # Create user
        self.client.post('/api/users/create/', {
            'name': 'Wrong Pass',
            'email': 'wrong@example.com',
            'password': 'Correct@123',
        }, format='json')

        # Login with wrong password
        response = self.client.post('/api/users/login/', {
            'email': 'wrong@example.com',
            'password': 'WrongPassword@1',
        }, format='json')

        self.assertEqual(response.status_code, 401)

    def test_login_nonexistent_user(self):
        """
        Test: Logging in with non-existent email returns 401.
        Why:  Should not reveal whether the email exists.
        """
        response = self.client.post('/api/users/login/', {
            'email': 'nouser@example.com',
            'password': 'Any@12345',
        }, format='json')

        self.assertEqual(response.status_code, 401)

    def test_get_users(self):
        """
        Test: GET /api/users/list/ returns all users without passwords.
        Why:  Verifies the list endpoint works and excludes sensitive data.
        """
        # Create two users
        self.client.post('/api/users/create/', {
            'name': 'User A', 'email': 'a@example.com', 'password': 'Test@1234',
        }, format='json')
        self.client.post('/api/users/create/', {
            'name': 'User B', 'email': 'b@example.com', 'password': 'Test@1234',
        }, format='json')

        response = self.client.get('/api/users/list/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        # Verify password is NOT included in the response
        for user in response.data:
            self.assertNotIn('password', user)

    def test_update_user(self):
        """
        Test: PUT /api/users/update/<email>/ updates user data.
        Why:  Verifies the update endpoint modifies the correct user.
        """
        self.client.post('/api/users/create/', {
            'name': 'Old Name', 'email': 'update@example.com', 'password': 'Test@1234',
        }, format='json')

        response = self.client.put('/api/users/update/update@example.com/', {
            'name': 'New Name',
        }, format='json')

        self.assertEqual(response.status_code, 200)

        # Verify the name was actually updated in the database
        user = User.objects(email='update@example.com').first()
        self.assertEqual(user.name, 'New Name')

    def test_delete_user(self):
        """
        Test: DELETE /api/users/delete/<email>/ removes the user.
        Why:  Verifies deletion works and cleans up associated tasks.
        """
        self.client.post('/api/users/create/', {
            'name': 'Delete Me', 'email': 'delete@example.com', 'password': 'Test@1234',
        }, format='json')

        response = self.client.delete('/api/users/delete/delete@example.com/')

        self.assertEqual(response.status_code, 200)

        # Verify user no longer exists
        user = User.objects(email='delete@example.com').first()
        self.assertIsNone(user)


# ============================================================
# TASK API TESTS
# ============================================================
class TaskAPITests(BaseTestCase):
    """
    Tests for Task CRUD operations:
      - POST   /api/users/tasks/create/         (Create)
      - GET    /api/users/tasks/list/<email>/    (Read)
      - PUT    /api/users/tasks/update/<id>/     (Update)
      - DELETE /api/users/tasks/delete/<id>/     (Delete)
    """

    def setUp(self):
        """Create a test user before each task test."""
        super().setUp()
        # Create a user that tasks will be linked to
        self.client.post('/api/users/create/', {
            'name': 'Task User',
            'email': 'taskuser@example.com',
            'password': 'Task@1234',
        }, format='json')

    def test_create_task_success(self):
        """
        Test: Creating a task for an existing user returns 201.
        Why:  Verifies task creation with all required fields.
        """
        response = self.client.post('/api/users/tasks/create/', {
            'email': 'taskuser@example.com',
            'text': 'Test task',
            'start_date': '2026-02-17',
            'due_date': '2026-02-20',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertIn('task_id', response.data)

    def test_create_task_default_pending(self):
        """
        Test: New tasks always have status 'Pending' by default.
        Why:  Status should always be 'Pending' on creation, even
              if the client sends a different status.
        """
        response = self.client.post('/api/users/tasks/create/', {
            'email': 'taskuser@example.com',
            'text': 'Should be pending',
            'status': 'Completed',                  # Client sends 'Completed'
        }, format='json')

        self.assertEqual(response.status_code, 201)

        # Verify task was saved with 'Pending' (not 'Completed')
        task = Task.objects(text='Should be pending').first()
        self.assertEqual(task.status, 'Pending')

    def test_create_task_no_user(self):
        """
        Test: Creating a task for a non-existent user returns 400.
        Why:  Tasks should only be created for registered users.
        """
        response = self.client.post('/api/users/tasks/create/', {
            'email': 'nobody@example.com',           # User doesn't exist
            'text': 'Orphan task',
        }, format='json')

        self.assertEqual(response.status_code, 400)

    def test_get_tasks(self):
        """
        Test: GET /api/users/tasks/list/<email>/ returns user's tasks.
        Why:  Verifies task listing works correctly.
        """
        # Create two tasks
        self.client.post('/api/users/tasks/create/', {
            'email': 'taskuser@example.com', 'text': 'Task 1',
        }, format='json')
        self.client.post('/api/users/tasks/create/', {
            'email': 'taskuser@example.com', 'text': 'Task 2',
        }, format='json')

        response = self.client.get('/api/users/tasks/list/taskuser@example.com/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_update_task_status(self):
        """
        Test: PUT /api/users/tasks/update/<id>/ changes task status.
        Why:  Verifies the status dropdown update works correctly.
        """
        # Create a task
        create_response = self.client.post('/api/users/tasks/create/', {
            'email': 'taskuser@example.com', 'text': 'Update me',
        }, format='json')
        task_id = create_response.data['task_id']

        # Update status to 'In Progress'
        response = self.client.put(f'/api/users/tasks/update/{task_id}/', {
            'status': 'In Progress',
        }, format='json')

        self.assertEqual(response.status_code, 200)

        # Verify status was updated in the database
        task = Task.objects(id=task_id).first()
        self.assertEqual(task.status, 'In Progress')

    def test_update_task_text(self):
        """
        Test: PUT /api/users/tasks/update/<id>/ changes task text.
        Why:  Verifies the edit functionality works.
        """
        create_response = self.client.post('/api/users/tasks/create/', {
            'email': 'taskuser@example.com', 'text': 'Old text',
        }, format='json')
        task_id = create_response.data['task_id']

        response = self.client.put(f'/api/users/tasks/update/{task_id}/', {
            'text': 'New text',
        }, format='json')

        self.assertEqual(response.status_code, 200)

        task = Task.objects(id=task_id).first()
        self.assertEqual(task.text, 'New text')

    def test_delete_task(self):
        """
        Test: DELETE /api/users/tasks/delete/<id>/ removes the task.
        Why:  Verifies task deletion works and the task is gone.
        """
        create_response = self.client.post('/api/users/tasks/create/', {
            'email': 'taskuser@example.com', 'text': 'Delete me',
        }, format='json')
        task_id = create_response.data['task_id']

        response = self.client.delete(f'/api/users/tasks/delete/{task_id}/')

        self.assertEqual(response.status_code, 200)

        # Verify task no longer exists
        task = Task.objects(id=task_id).first()
        self.assertIsNone(task)

    def test_delete_user_cascades_tasks(self):
        """
        Test: Deleting a user also deletes all their tasks.
        Why:  Prevents orphaned tasks in the database.
        """
        # Create tasks for the user
        self.client.post('/api/users/tasks/create/', {
            'email': 'taskuser@example.com', 'text': 'Task to cascade',
        }, format='json')

        # Delete the user
        self.client.delete('/api/users/delete/taskuser@example.com/')

        # Verify all tasks for this user are also deleted
        tasks = Task.objects(email='taskuser@example.com')
        self.assertEqual(tasks.count(), 0)
