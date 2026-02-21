# ============================================================
# Dockerfile — Django Backend Container
# ============================================================
# What: Builds a Docker image for the Django REST API backend
# How:  Uses Python 3.10 slim image, installs dependencies,
#       copies code, and runs the Django development server
# Why:  Containerization ensures the backend runs the same way
#       everywhere — local, staging, and production
#
# Build: docker build -t earth-backend .
# Run:   docker run -p 8000:8000 earth-backend
# ============================================================

# ---- Stage: Base Python Image ----
# python:3.10-slim is a lightweight Debian image with Python pre-installed
# "slim" variant is ~150MB smaller than the full image
FROM python:3.10-slim

# ---- Set Working Directory ----
# All subsequent commands will run inside /app in the container
WORKDIR /app

# ---- Install Dependencies First (Docker Layer Caching) ----
# Copying requirements.txt BEFORE the rest of the code means
# Docker can cache this layer. Dependencies only re-install
# when requirements.txt changes, not on every code change.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- Copy Application Code ----
# Copy the entire backend project into the container
COPY backend/ ./backend/

# ---- Set Working Directory to Django Project ----
WORKDIR /app/backend

# ---- Expose Port 8000 ----
# This tells Docker the container listens on port 8000
# (Django's default development server port)
EXPOSE 8000

# ---- Run the Django Development Server ----
# 0.0.0.0 makes the server accessible from outside the container
# (localhost would only work inside the container)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
