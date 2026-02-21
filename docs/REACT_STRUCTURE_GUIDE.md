# React Scalable Structure Guide

## Overview

The frontend has been restructured from a flat component layout into a layered architecture with **services**, **hooks**, **context**, and **utils**.

---

## Directory Structure

```
src/
├── components/        # UI Components (display + local state)
│   ├── LoginPage.js
│   ├── TaskList.js
│   ├── Header.js
│   └── Greeting.js
│
├── hooks/             # Custom React Hooks (business logic)
│   ├── useAuth.js     # Authentication (login, signup, logout)
│   └── useTasks.js    # Task CRUD (fetch, add, edit, delete)
│
├── services/          # API Service Layer (HTTP calls)
│   ├── api.js         # Centralized Axios + JWT interceptors
│   ├── authService.js # Auth API calls + localStorage
│   └── taskService.js # Task API calls
│
├── context/           # React Context (global state)
│   └── AuthContext.js # Auth state shared across app
│
├── utils/             # Shared Utilities
│   └── validators.js  # Email & password validation
│
└── App.js             # Root: AuthProvider + Router
```

---

## Layer Responsibilities

| Layer | What it does | Example |
|-------|-------------|---------|
| **Components** | UI rendering + local state | `TaskList.js` renders task cards |
| **Hooks** | Business logic + state management | `useTasks.js` manages task CRUD |
| **Services** | HTTP calls (no state) | `taskService.js` calls API |
| **Context** | Global state via React Context | `AuthContext.js` shares user info |
| **Utils** | Pure helper functions | `validators.js` validates email |

---

## Data Flow

```
User Action → Component → Hook → Service → API → Backend
                 ↕            ↕
              Local State  Context (global)
```

### Example: Creating a Task
1. User clicks "Create Task" in `TaskList.js`
2. `TaskList` calls `addTask()` from `useTasks` hook
3. `useTasks` calls `taskService.createTask()`
4. `taskService` uses `api.js` (Axios auto-adds JWT token)
5. Backend receives request, validates JWT, creates task
6. Response flows back; `useTasks` updates local state (optimistic update)

---

## Key Modules

### `services/api.js` — Centralized Axios
- Base URL: `http://localhost:8000/api`
- **Request interceptor**: auto-attaches `Authorization: Bearer <token>`
- **Response interceptor**: auto-refreshes expired tokens (401 → refresh → retry)

### `hooks/useAuth.js`
```js
const { user, login, signup, logout, isAuthenticated } = useAuth();
```

### `hooks/useTasks.js`
```js
const { tasks, loading, addTask, editTask, removeTask, changeStatus } = useTasks(userEmail);
```

### `context/AuthContext.js`
- Persists auth to `localStorage` (survives page refresh)
- Wraps app in `<AuthProvider>`
- Accessed via `useAuth()` hook

### `utils/validators.js`
```js
isValidEmail('user@example.com')      // true
isValidPassword('Test@1234')          // true
getPasswordStrength('abc')            // { minLength: false, ... }
```

---

## Files Changed

| File | Change |
|------|--------|
| `App.js` | Wrapped with `AuthProvider`, uses `useAuth` hook |
| `LoginPage.js` | Uses `useAuth` hook, imports from `validators.js` |
| `TaskList.js` | Uses `useTasks` hook, no direct axios calls |
| 7 new files | Services, hooks, context, utils (listed above) |
