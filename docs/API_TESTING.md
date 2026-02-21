# API Testing Guide — Postman

**Base URL:** `http://localhost:8000`  
**Headers for POST/PUT:** `Content-Type: application/json`

---

## 🔹 USER APIs

### 1. Create User — `POST`
```
http://localhost:8000/api/users/create/
```
```json
{
    "name": "Prerana",
    "email": "prerana@gmail.com",
    "password": "prerana123"
}
```

### 2. Login — `POST`
```
http://localhost:8000/api/users/login/
```
```json
{
    "email": "prerana@gmail.com",
    "password": "prerana123"
}
```

### 3. List All Users — `GET`
```
http://localhost:8000/api/users/list/
```

### 4. Update User — `PUT`
```
http://localhost:8000/api/users/update/prerana@gmail.com/
```
```json
{
    "name": "Prerana Kadam"
}
```

### 5. Delete User — `DELETE`
```
http://localhost:8000/api/users/delete/prerana@gmail.com/
```

---

## 🔹 TASK APIs

### 6. Create Task — `POST`
```
http://localhost:8000/api/users/tasks/create/
```
```json
{
    "email": "prerana@gmail.com",
    "text": "Build REST APIs with Django",
    "status": "Pending",
    "start_date": "2026-02-17",
    "due_date": "2026-02-20"
}
```

### 7. List User's Tasks — `GET`
```
http://localhost:8000/api/users/tasks/list/prerana@gmail.com/
```

### 8. Update Task — `PUT`
> Replace `<task_id>` with the actual `task_id` from Create Task response
```
http://localhost:8000/api/users/tasks/update/<task_id>/
```
```json
{
    "text": "Build REST APIs with Django and MongoDB",
    "status": "In Progress",
    "start_date": "2026-02-17",
    "due_date": "2026-02-22"
}
```

### 9. Delete Task — `DELETE`
> Replace `<task_id>` with the actual task ID
```
http://localhost:8000/api/users/tasks/delete/<task_id>/
```

---

## 📋 Testing Order

1. **Create User** → copy the email
2. **Login** → verify credentials work
3. **Create Task** → copy `task_id` from response
4. **List Tasks** → verify task appears
5. **Update Task** → change status to `"In Progress"` or `"Completed"`
6. **List Tasks** → verify update
7. **Delete Task** → remove a task
8. **List Users** → see all users
9. **Delete User** → cleanup

---

## 📌 Status Options for Tasks

| Status | Description |
|--------|-------------|
| `Pending` | Task not started yet |
| `In Progress` | Task is being worked on |
| `Completed` | Task is finished |

---

## 🚀 Start Server

```bash
cd earth-backend/backend
conda activate earth_env
python3 manage.py runserver
```
Server runs at `http://localhost:8000`
