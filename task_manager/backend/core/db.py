import os
import mongoengine

MONGO_HOST = os.environ.get('MONGO_HOST', 'localhost')
MONGO_PORT = os.environ.get('MONGO_PORT', '27017')
MONGO_DB = os.environ.get('MONGO_DB', 'taskmanager_db')

if MONGO_HOST.startswith('mongodb'):
    mongoengine.connect(db=MONGO_DB, host=MONGO_HOST)
else:
    mongoengine.connect(
        db=MONGO_DB,
        host=f'mongodb://{MONGO_HOST}:{MONGO_PORT}/'
    )
