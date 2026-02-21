# ============================================================
# db.py — MongoDB Connection using MongoEngine (ORM/ODM)
# ============================================================
# MongoEngine is an Object Document Mapper (ODM) for MongoDB.
# It works like Django's ORM but for document databases.
#
# Connection Priority:
#   1. Docker: Uses MONGO_HOST environment variable (set in docker-compose.yml)
#   2. Local:  Falls back to localhost:27017 for local development
# ============================================================

import os
import mongoengine

# Read MongoDB connection settings from environment variables
# Docker sets MONGO_HOST='mongo' (the container name)
# Local development defaults to 'localhost'
MONGO_HOST = os.environ.get('MONGO_HOST', 'localhost')
MONGO_PORT = os.environ.get('MONGO_PORT', '27017')
MONGO_DB = os.environ.get('MONGO_DB', 'intern_db')

# Connect MongoEngine to MongoDB
mongoengine.connect(
    db=MONGO_DB,
    host=f'mongodb://{MONGO_HOST}:{MONGO_PORT}/'
)
