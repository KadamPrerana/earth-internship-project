# 🚀 CI/CD Pipeline Setup Guide — Smart Task Manager

## Table of Contents
1. [Pipeline Overview](#pipeline-overview)
2. [GitHub Actions Workflow](#github-actions-workflow)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Docker Commands Reference](#docker-commands-reference)
5. [Git Workflow Commands](#git-workflow-commands)
6. [Troubleshooting](#troubleshooting)

---

## Pipeline Overview

```
┌────────────┐     ┌──────────────────────────────────────────────────┐
│  Developer │     │           GitHub Actions CI Pipeline             │
│  pushes to │────▶│                                                  │
│  dev/main  │     │  ┌─────────────┐  ┌──────────────┐              │
│            │     │  │ Backend     │  │ Frontend     │              │
│            │     │  │ Tests (31)  │  │ Tests + Build│              │
│            │     │  └──────┬──────┘  └──────┬───────┘              │
│            │     │         │     Both Pass   │                     │
│            │     │         └────────┬────────┘                     │
│            │     │                  ▼                              │
│            │     │         ┌────────────────┐                     │
│            │     │         │ Docker Build   │                     │
│            │     │         │ Verification   │                     │
│            │     │         └────────────────┘                     │
└────────────┘     └──────────────────────────────────────────────────┘
```

### Three CI Jobs:
| Job | What it does | Duration |
|-----|-------------|----------|
| **Backend Tests** | Spins up MongoDB, runs 31 Django unit tests | ~2 min |
| **Frontend Tests** | `npm test` + `npm run build` | ~2 min |
| **Docker Build** | Builds both Docker images (runs after tests pass) | ~3 min |

---

## GitHub Actions Workflow

The CI workflow file is located at:
```
task_manager/.github/workflows/ci.yml
```

It triggers on:
- **Push** to `dev` or `main` branches
- **Pull Requests** targeting `dev` or `main`

---

## Step-by-Step Implementation

### Step 1: Verify the CI Workflow File Exists

```bash
# Check the file exists
cat task_manager/.github/workflows/ci.yml
```

The file has already been created. It contains 3 jobs:
- `backend-tests` — Python 3.10 + MongoDB service container
- `frontend-tests` — Node.js 18 + npm test + npm build
- `docker-build` — Builds both Docker images (only after tests pass)

### Step 2: Add, Commit, and Push to Dev Branch

```bash
# Navigate to the project root (where .git is)
cd ~/Desktop/Earth_s

# Check current branch
git branch

# Switch to dev branch (if not already on it)
git checkout dev

# Stage the new CI workflow and task_manager changes
git add task_manager/.github/workflows/ci.yml
git add task_manager/

# Commit the changes
git commit -m "ci: Add GitHub Actions CI pipeline for task_manager

- Backend tests with MongoDB service container
- Frontend tests and build verification
- Docker image build verification
- Triggers on push/PR to dev and main branches"

# Push to dev branch
git push origin dev
```

### Step 3: Verify the Pipeline on GitHub

1. Go to: **https://github.com/KadamPrerana/earth-internship-project**
2. Click the **"Actions"** tab at the top
3. You should see the **"CI Pipeline"** workflow running
4. Click on it to see the 3 jobs and their logs

### Step 4: Check Pipeline Status

- ✅ **Green checkmark** = All tests passed
- ❌ **Red X** = Something failed (click to see logs)
- 🟡 **Yellow dot** = Pipeline is still running

---

## Docker Commands Reference

### Starting Docker Containers

```bash
# Navigate to the project
cd ~/Desktop/Earth_s/task_manager

# Start all services in the background
docker-compose up -d

# Start all services with fresh builds
docker-compose up -d --build

# Start all services in foreground (see logs)
docker-compose up

# Start all services with rebuild
docker-compose up --build

# Start only a specific service
docker-compose up -d backend
docker-compose up -d frontend
docker-compose up -d mongo
```

### Stopping Docker Containers

```bash
# Stop all running containers
docker-compose stop

# Stop and remove containers + networks
docker-compose down

# Stop and remove containers + networks + volumes (DELETES DATA)
docker-compose down -v

# Stop a specific service
docker-compose stop backend
docker-compose stop frontend
```

### Checking Docker Status

```bash
# List running containers
docker-compose ps

# View logs of all services
docker-compose logs

# View logs of a specific service (live follow)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo

# View last 50 log lines of backend
docker-compose logs --tail=50 backend
```

### Rebuilding Docker Images

```bash
# Rebuild all images
docker-compose build

# Rebuild a specific service
docker-compose build backend
docker-compose build frontend

# Rebuild with no cache (fresh build)
docker-compose build --no-cache

# Rebuild and start
docker-compose up -d --build
```

### Managing Docker Resources

```bash
# List all Docker images
docker images

# Remove unused/dangling images
docker image prune

# Remove all stopped containers
docker container prune

# View disk space used by Docker
docker system df

# Full cleanup (WARNING: removes everything not in use)
docker system prune -a
```

---

## Git Workflow Commands

### Daily Development Workflow

```bash
# 1. Make sure you're on dev branch
git checkout dev

# 2. Pull latest changes
git pull origin dev

# 3. Make your changes (edit code)
#    ...

# 4. Stage changes
git add .

# 5. Commit with a meaningful message
git commit -m "feat: Add new feature description"

# 6. Push to dev (triggers CI pipeline)
git push origin dev
```

### Merging Dev to Main (after CI passes)

```bash
# 1. Switch to main branch
git checkout main

# 2. Pull latest main
git pull origin main

# 3. Merge dev into main
git merge dev

# 4. Push to main (triggers CI again)
git push origin main

# 5. Switch back to dev for next work
git checkout dev
```

### Creating a Pull Request (Alternative)

```bash
# 1. Push your changes to dev
git push origin dev

# 2. Go to GitHub → Pull Requests → New Pull Request
# 3. Set: base=main ← compare=dev
# 4. CI automatically runs on the PR
# 5. After review & CI passes → click "Merge"
```

### Commit Message Convention

```
feat: Add new feature
fix: Fix a bug
ci: CI/CD configuration changes
docs: Documentation updates
style: CSS/UI changes
refactor: Code refactoring
test: Adding/updating tests
```

---

## Troubleshooting

### CI Pipeline Fails — Backend Tests

```bash
# Run tests locally to debug
cd task_manager/backend
python3 manage.py test core -v 2
```

Common fixes:
- Ensure MongoDB is running: `sudo systemctl start mongod`
- Check `requirements.txt` has all dependencies
- Ensure `DATABASES` has the sqlite3 in-memory config for test runner

### CI Pipeline Fails — Frontend Tests

```bash
# Run tests locally
cd task_manager/frontend
CI=true npm test -- --watchAll=false
```

Common fixes:
- Run `npm install` to ensure all dependencies are present
- Ensure `@testing-library/react` is installed

### CI Pipeline Fails — Docker Build

```bash
# Test Docker build locally
cd task_manager
docker-compose build --no-cache
```

Common fixes:
- Check Dockerfile syntax
- Ensure `package-lock.json` is committed (needed for `npm ci`)
- Ensure `requirements.txt` is up to date

### Docker Container Not Connecting to MongoDB

```bash
# Check if mongo container is healthy
docker-compose ps

# Check backend logs
docker-compose logs backend

# Restart everything
docker-compose down && docker-compose up -d --build
```

> **Remember:** Inside Docker network, `MONGO_PORT` must be `27017` (internal port), 
> not the host-mapped port (27018).

---

## Quick Reference Card

| Action | Command |
|--------|---------|
| **Start all (background)** | `docker-compose up -d` |
| **Start all (with rebuild)** | `docker-compose up -d --build` |
| **Stop all** | `docker-compose stop` |
| **Stop & remove** | `docker-compose down` |
| **View logs** | `docker-compose logs -f` |
| **Check status** | `docker-compose ps` |
| **Run backend tests** | `cd backend && python3 manage.py test core -v 2` |
| **Run frontend tests** | `cd frontend && CI=true npm test -- --watchAll=false` |
| **Push & trigger CI** | `git add . && git commit -m "msg" && git push origin dev` |
| **Check CI status** | Go to GitHub → Actions tab |
