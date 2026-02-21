# Docker & Testing — Step-by-Step Guide

This document explains **what** each file does, **how** to use it, and **why** we need it.

---

## Table of Contents
1. [Docker Setup](#1-docker-setup)
2. [Django Unit Tests](#2-django-unit-tests)
3. [React Jest Tests](#3-react-jest-tests)
4. [Quick Reference Commands](#4-quick-reference-commands)

---

## 1. Docker Setup

### What is Docker?
Docker packages your application into **containers** — lightweight, portable environments that run the same everywhere (your laptop, your teammate's laptop, a cloud server).

### Why Docker?
| Problem | Docker Solution |
|---------|----------------|
| "Works on my machine" | Same environment everywhere |
| Complex setup (Python, Node, MongoDB) | One command starts everything |
| Version conflicts | Each service has its own isolated environment |

---

### Files Created

#### 1.1 `requirements.txt` (Backend)
**What**: Lists all Python packages the backend needs  
**Why**: Docker uses this to install dependencies inside the container  
**Location**: `earth-backend/requirements.txt`

```
Django==5.2.11
djangorestframework==3.16.1
django-cors-headers==4.9.0
mongoengine==0.29.1
pymongo==4.15.4
Werkzeug==3.1.3
PyJWT==2.3.0
```

> **Why pin versions?** So every environment installs the exact same package versions, preventing bugs caused by version differences.

---

#### 1.2 Backend `Dockerfile`
**What**: Instructions to build the Django backend container  
**Why**: Containerizes the Django API so it runs in an isolated Python environment  
**Location**: `earth-backend/Dockerfile`

**How it works (step-by-step):**
```
python:3.10-slim          ← 1. Start with a lightweight Python image
├── WORKDIR /app          ← 2. Set working directory
├── COPY requirements.txt ← 3. Copy dependencies file (cached layer)
├── pip install           ← 4. Install Python packages
├── COPY backend/         ← 5. Copy application code
├── EXPOSE 8000           ← 6. Open port 8000
└── CMD runserver         ← 7. Start Django server
```

> **Why copy `requirements.txt` first?** Docker caches each layer. If only your code changes (not dependencies), Docker skips the `pip install` step — **much faster rebuilds**.

---

#### 1.3 Frontend `Dockerfile` (Multi-Stage)
**What**: Builds React and serves it with Nginx  
**Why**: Multi-stage build keeps the final image tiny (~25MB vs ~1GB)  
**Location**: `earth-frontend/Dockerfile`

**How it works (step-by-step):**
```
Stage 1: BUILD (Node.js)
├── COPY package*.json    ← 1. Copy dependency files
├── npm install           ← 2. Install Node packages
├── COPY . .              ← 3. Copy React source code
└── npm run build         ← 4. Compile to static HTML/CSS/JS

Stage 2: SERVE (Nginx)
├── COPY --from=build     ← 5. Copy ONLY the build output
├── nginx config          ← 6. Configure for React Router
└── CMD nginx             ← 7. Start web server
```

> **Why multi-stage?** Stage 1 has Node.js + node_modules (~1GB). Stage 2 only has the compiled files + nginx (~25MB). We throw away everything from Stage 1 — keeping the final image very small.

---

#### 1.4 `docker-compose.yml`
**What**: Orchestrates all 3 services (MongoDB, Django, React)  
**Why**: One command (`docker-compose up`) starts the entire application  
**Location**: `project/docker-compose.yml`

**Architecture:**
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│   MongoDB   │
│  (Nginx:80) │     │ (Django:8000)│     │  (:27017)   │
│  port 3000  │     │  port 8000   │     │  port 27017 │
└─────────────┘     └──────────────┘     └─────────────┘
                                          │
                                          ▼
                                    mongo_data volume
                                    (persists data)
```

**Key settings explained:**
- `depends_on`: Backend waits for MongoDB, Frontend waits for Backend
- `volumes: mongo_data`: Data survives container restarts
- `MONGO_HOST=mongo`: Backend connects to MongoDB by container name
- `ports: "3000:80"`: Host port 3000 maps to container port 80

---

#### 1.5 `.dockerignore` Files
**What**: Files Docker should skip when building  
**Why**: Reduces build context size (node_modules alone is 200MB+)

---

#### 1.6 `db.py` Update
**What**: Updated MongoDB connection to read from environment variables  
**Why**: Works in both Docker (`MONGO_HOST=mongo`) and local (`localhost`)

```python
MONGO_HOST = os.environ.get('MONGO_HOST', 'localhost')   # Docker: 'mongo'
MONGO_PORT = os.environ.get('MONGO_PORT', '27017')
MONGO_DB   = os.environ.get('MONGO_DB', 'intern_db')
```

---

### Docker Commands

```bash
# Build all images
docker-compose build

# Start all services (with logs visible)
docker-compose up --build

# Start in background (detached mode)
docker-compose up -d

# Check running containers
docker-compose ps

# View logs for a specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo

# Stop all services
docker-compose down

# Stop and remove all data (including MongoDB volume)
docker-compose down -v
```

---

## 2. Django Unit Tests

### What are Unit Tests?
Unit tests are automated checks that verify each function/endpoint works correctly. They run in seconds and catch bugs early.

### Why Write Tests?
| Benefit | Example |
|---------|---------|
| Catch bugs early | Password validation test catches missing special char check |
| Prevent regressions | Adding a feature doesn't break existing APIs |
| Documentation | Tests show HOW each API should behave |
| Confidence | Deploy knowing everything still works |

### Test File: `users/tests.py`
**Location**: `earth-backend/backend/users/tests.py`

### Test Database
Tests use a separate database (`test_intern_db`) so your real data is never affected. The test database is created before tests run and dropped after.

### Tests Written

#### User API Tests (11 tests)
| # | Test | What it Verifies |
|---|------|-----------------|
| 1 | `test_create_user_success` | Valid signup → 201 + saved to DB |
| 2 | `test_create_user_duplicate_email` | Duplicate email → 400 |
| 3 | `test_create_user_invalid_email` | Bad format → 400 |
| 4 | `test_create_user_weak_password` | Missing special char → 400 |
| 5 | `test_create_user_empty_fields` | Empty fields → 400 |
| 6 | `test_login_success` | Correct credentials → 200 + user data |
| 7 | `test_login_wrong_password` | Wrong password → 401 |
| 8 | `test_login_nonexistent_user` | Unknown email → 401 |
| 9 | `test_get_users` | List users (no passwords) → 200 |
| 10 | `test_update_user` | Change name → 200 + verified |
| 11 | `test_delete_user` | Delete → 200 + user gone |

#### Task API Tests (7 tests)
| # | Test | What it Verifies |
|---|------|-----------------|
| 12 | `test_create_task_success` | Valid task → 201 + task_id |
| 13 | `test_create_task_default_pending` | Status always "Pending" on create |
| 14 | `test_create_task_no_user` | Non-existent user → 400 |
| 15 | `test_get_tasks` | List user's tasks → correct count |
| 16 | `test_update_task_status` | Change to "In Progress" → verified |
| 17 | `test_update_task_text` | Change text → verified |
| 18 | `test_delete_task` | Delete → task gone |

### How to Run

```bash
cd earth-backend/backend
python3 manage.py test users -v 2
```

`-v 2` shows verbose output with each test name and result.

---

## 3. React Jest Tests

### What is Jest?
Jest is the default JavaScript testing framework for React apps. It runs tests in Node.js (no browser needed).

### Why React Testing Library?
Instead of testing implementation details (state, hooks), React Testing Library tests **what the user sees** — text, buttons, inputs. This makes tests resilient to code refactors.

### Test Files
- `LoginPage.test.js` — Login/Signup form tests
- `TaskList.test.js` — Task list rendering and interaction tests

### Tests Written

#### LoginPage Tests (7 tests)
| # | Test | What it Verifies |
|---|------|-----------------|
| 1 | Renders login form | Email + Password fields visible |
| 2 | Shows Task Manager title | Brand title present |
| 3 | Shows welcome message | "Welcome back" text |
| 4 | Toggle to signup mode | Name field appears |
| 5 | Toggle back to login | Name field disappears |
| 6 | Empty email validation | Error message shown |
| 7 | Invalid email validation | "valid email" error |
| 8 | Email indicator (✅/❌) | Real-time feedback works |
| 9 | Password rules panel | Rules shown during signup |

#### TaskList Tests (10 tests)
| # | Test | What it Verifies |
|---|------|-----------------|
| 1 | Renders "Add New Task" button | Button visible |
| 2 | Renders task cards | Task text displayed |
| 3 | Renders status badges | Status dropdowns present |
| 4 | Shows loading state | "Loading tasks" message |
| 5 | Shows empty state | "No tasks yet" message |
| 6 | Displays task count | Summary shows count |
| 7 | Shows add form on click | Form appears with input |
| 8 | Default pending message | "Pending" note in form |
| 9 | Cancel hides form | Form disappears |
| 10 | Submit calls addTask | createTask called correctly |

### How to Run

```bash
cd earth-frontend
npm test -- --watchAll=false
```

`--watchAll=false` runs tests once and exits (instead of watch mode).

---

## 4. Quick Reference Commands

| Task | Command |
|------|---------|
| Start Docker stack | `docker-compose up --build` |
| Stop Docker stack | `docker-compose down` |
| Run Django tests | `cd earth-backend/backend && python3 manage.py test users -v 2` |
| Run React tests | `cd earth-frontend && npm test -- --watchAll=false` |
| View Docker logs | `docker-compose logs -f` |
| Rebuild single service | `docker-compose build backend` |

---

## Project Structure After Changes

```
project/
├── docker-compose.yml                    ← Orchestrates all services
│
├── earth-backend/
│   ├── Dockerfile                        ← Django container definition
│   ├── requirements.txt                  ← Python dependencies
│   ├── .dockerignore                     ← Excludes __pycache__, .git
│   └── backend/
│       └── users/
│           ├── db.py                     ← Updated for Docker env vars
│           ├── tests.py                  ← 18 Django unit tests
│           └── ...
│
├── earth-frontend/
│   ├── Dockerfile                        ← React multi-stage container
│   ├── .dockerignore                     ← Excludes node_modules
│   └── src/
│       └── components/
│           ├── LoginPage.test.js         ← 9 React tests
│           ├── TaskList.test.js          ← 10 React tests
│           └── ...
│
└── docs/
    └── DOCKER_AND_TESTING.md             ← This documentation
```
