"""
App config for core. Initializes MongoDB connection on startup.
"""
from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        """Initialize MongoDB connection and seed admin user."""
        import core.db  # noqa: F401 — triggers mongoengine.connect()
        self._seed_admin()

    def _seed_admin(self):
        """Create default admin user if none exists."""
        try:
            import bcrypt
            from core.models import User

            if not User.objects(role='admin').first():
                hashed = bcrypt.hashpw(
                    'Admin@123'.encode('utf-8'),
                    bcrypt.gensalt()
                )
                User(
                    name='Admin',
                    email='admin@taskmanager.com',
                    password=hashed.decode('utf-8'),
                    role='admin',
                    is_blocked=False
                ).save()
                print('✅ Default admin user created: admin@taskmanager.com / Admin@123')
            else:
                print('ℹ️  Admin user already exists')
        except Exception as e:
            print(f'⚠️  Could not seed admin user: {e}')
