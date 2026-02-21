# JWT Authentication Guide

## Overview

The API uses **JSON Web Tokens (JWT)** to protect task endpoints. After login, the server returns two tokens:
- **Access Token** — short-lived (30 min), used for API requests
- **Refresh Token** — long-lived (7 days), used to get new access tokens

---

## How It Works

```
1. User logs in → Server returns access + refresh tokens
2. Frontend stores tokens in localStorage
3. Frontend sends access token with every API request
4. When access token expires → Frontend uses refresh token to get a new one
5. When refresh token expires → User must login again
```

---

## Endpoints

### Login — `POST /api/users/login/`
```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test@1234"}'
```

**Response:**
```json
{
    "message": "Login successful",
    "user": { "name": "Test User", "email": "test@example.com" },
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Refresh Token — `POST /api/users/token/refresh/`
```bash
curl -X POST http://localhost:8000/api/users/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "eyJhbGciOiJIUzI1NiIs..."}'
```

**Response:**
```json
{
    "access": "eyJhbGciOiJIUzI1NiIs...(new)...",
    "refresh": "eyJhbGciOiJIUzI1NiIs...(new)..."
}
```

---

## Using Protected Endpoints

All task endpoints require the `Authorization` header:
```bash
curl http://localhost:8000/api/users/tasks/list/test@example.com/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Without token → 401:**
```json
{
    "error": "Authentication required. Provide 'Authorization: Bearer <token>' header.",
    "status_code": 401,
    "type": "authentication_error"
}
```

**Expired token → 401:**
```json
{
    "error": "Token has expired. Please refresh your token.",
    "status_code": 401,
    "type": "token_expired"
}
```

---

## Protected vs Public Endpoints

| Endpoint | Method | Protected? |
|----------|--------|-----------|
| `/api/users/create/` | POST | ❌ Public |
| `/api/users/list/` | GET | ❌ Public |
| `/api/users/update/<email>/` | PUT | ❌ Public |
| `/api/users/delete/<email>/` | DELETE | ❌ Public |
| `/api/users/login/` | POST | ❌ Public |
| `/api/users/token/refresh/` | POST | ❌ Public |
| `/api/users/tasks/create/` | POST | ✅ JWT Required |
| `/api/users/tasks/list/<email>/` | GET | ✅ JWT Required |
| `/api/users/tasks/update/<task_id>/` | PUT | ✅ JWT Required |
| `/api/users/tasks/delete/<task_id>/` | DELETE | ✅ JWT Required |

---

## Token Configuration

| Setting | Value | File |
|---------|-------|------|
| Access token expiry | 30 minutes | `authentication.py` |
| Refresh token expiry | 7 days | `authentication.py` |
| Algorithm | HS256 | `authentication.py` |
| Signing key | `settings.SECRET_KEY` | `settings.py` |

---

## Files

| File | Purpose |
|------|---------|
| `users/authentication.py` | Token generation and decoding |
| `users/decorators.py` | `@jwt_required` decorator |
| `users/views.py` | Login returns tokens, refresh endpoint |
| `users/urls.py` | Token refresh URL route |
