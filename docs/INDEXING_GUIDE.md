# Compound Indexing & Query Optimization Guide

## Overview

MongoDB indexes speed up queries by avoiding full collection scans. This project uses **compound indexes** (indexes on multiple fields) to optimize the most common query patterns.

---

## Indexes Defined

### User Collection

| Index | Fields | Purpose |
|-------|--------|---------|
| Unique | `email` | Fast login, lookup, duplicate check (auto-created by `unique=True`) |
| Sort | `-created_at` | Sorted user listing |

### Task Collection

| Index | Fields | Purpose |
|-------|--------|---------|
| Single | `email` | List all tasks for a user |
| Compound | `(email, status)` | Filter tasks by user + status |
| Compound | `(email, -created_at)` | Tasks sorted newest first per user |
| Compound | `(email, due_date)` | Tasks sorted by due date per user |

---

## Query Optimizations Applied

| Query | Optimization | Index Used |
|-------|-------------|------------|
| `User.objects()` | `.only('name', 'email', 'created_at')` — excludes password hash | — |
| `User.objects(email=email)` | `.only('name', 'email', 'password')` — loads only auth fields | `email` (unique) |
| `Task.objects(email=email)` | `.only(...)` + `.order_by('-created_at')` | `(email, -created_at)` |

### What `.only()` does
Tells MongoDB to return only the specified fields instead of the full document. This reduces:
- Network transfer size
- Memory usage
- Deserialization time

### What compound indexes do
A compound index on `(email, status)` means MongoDB can:
1. Find all tasks for an email in O(log n)
2. Then filter by status within those results without scanning

---

## How to Verify Indexes

```bash
# Connect to MongoDB shell
mongosh

# Switch to the database
use intern_db

# List all indexes on tasks collection
db.tasks.getIndexes()

# Expected output includes:
# { "email": 1 }
# { "email": 1, "status": 1 }
# { "email": 1, "created_at": -1 }
# { "email": 1, "due_date": 1 }

# Explained query — check if indexes are used
db.tasks.find({ email: "test@example.com" }).explain("executionStats")
# Look for: "winningPlan.stage": "IXSCAN" (index scan, good!)
# Bad: "winningPlan.stage": "COLLSCAN" (collection scan, slow)
```

---

## Files Modified

| File | Change |
|------|--------|
| `users/models.py` | Added `indexes` list to `User.meta` and `Task.meta` |
| `users/views.py` | Added `.only()` and `.order_by()` to queries |
