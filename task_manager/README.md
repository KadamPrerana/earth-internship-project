# 🛡️ Smart Role-Based Task Management System

A full-stack **hybrid task management system** with Django + MongoDB backend, React frontend, JWT authentication, Role-Based Access Control (RBAC), Docker support, and comprehensive testing.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  React Frontend │────▶│  Django Backend   │────▶│   MongoDB   │
│  (Port 3000)    │     │  (Port 8000)      │     │ (Port 27017)│
│  Nginx in Docker│     │  DRF + MongoEngine│     │ taskmanager_db
└─────────────────┘     └──────────────────┘     └─────────────┘
```

## 👥 Roles

| Role | Capabilities |
|------|-------------|
| **User** | Create/edit/delete own tasks, filters, CSV export, profile |
| **Admin** | All user capabilities + manage users, assign tasks, analytics, activity logs |

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.10+, Node.js 18+, MongoDB running on port 27017
- Conda environment: `conda activate earth_env`

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```
> ✅ Admin auto-seeded: `admin@taskmanager.com` / `Admin@123`

### Frontend
```bash
cd frontend
npm install
npm start
```
> Open http://localhost:3000

## 🐳 Docker Setup

```bash
# Docker Compose v2
docker compose up --build

# Docker Compose v1 (older systems)
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MongoDB: localhost:27017

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test core -v 2
```

### Frontend Tests
```bash
cd frontend
CI=true npm test -- --watchAll=false
```

## 📁 Project Structure

```
task_manager/
├── backend/
│   ├── taskmanager/        # Django project settings
│   ├── core/               # Main app
│   │   ├── models.py       # User, Task, ActivityLog
│   │   ├── views/          # auth, task, admin APIs
│   │   ├── middleware.py   # JWT authentication
│   │   ├── decorators.py   # RBAC (@role_required)
│   │   ├── utils.py        # Validators, CSV, pagination
│   │   └── tests.py        # 30+ unit tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios with JWT interceptor
│   │   ├── context/        # AuthContext
│   │   ├── components/     # Navbar, TaskCard, Filters, etc.
│   │   ├── pages/          # Login, Register, Dashboards, Profile
│   │   └── App.css         # Premium dark theme
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔑 API Endpoints (28 total)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login → JWT token |
| GET | `/api/auth/profile/` | Get profile |
| PUT | `/api/auth/profile/update/` | Update profile |

### User Tasks
| POST | `/api/tasks/` | Create task |
| GET | `/api/tasks/list/` | List tasks (filters, pagination) |
| PUT | `/api/tasks/<id>/update/` | Update task |
| DELETE | `/api/tasks/<id>/delete/` | Delete task |
| PATCH | `/api/tasks/<id>/complete/` | Mark complete |
| GET | `/api/tasks/export/csv/` | Export CSV |

### Admin
| GET | `/api/admin/users/` | List users |
| POST | `/api/admin/users/create/` | Create user |
| PATCH | `/api/admin/users/<id>/block/` | Block/unblock |
| DELETE | `/api/admin/users/<id>/delete/` | Delete user |
| GET | `/api/admin/tasks/` | All tasks |
| POST | `/api/admin/tasks/assign/` | Assign task |
| GET | `/api/admin/analytics/` | Dashboard analytics |
| GET | `/api/admin/activity-logs/` | Activity logs |

## 🔒 Security Features
- JWT authentication with token expiry
- bcrypt password hashing
- Role-based API protection
- CORS configuration
- Blocked user enforcement
- Input validation (email regex, password complexity)

## 📊 Key Features
- ✅ Hybrid task system (personal + admin-assigned)
- ✅ Analytics dashboard with charts (Recharts)
- ✅ CSV export for tasks
- ✅ Activity logging
- ✅ Compound MongoDB indexes
- ✅ Responsive dark UI with glassmorphism
- ✅ Real-time password strength validation
- ✅ Task filtering, search & pagination
