# MongoDB Backup & Restore Guide

## Overview

This project uses `mongodump` and `mongorestore` to backup and restore the `intern_db` MongoDB database. Backups are stored in the `mongo_backups/` directory.

---

## Backup — `mongodb_backup.sh`

### What it does
1. Runs `mongodump` to export all collections from `intern_db`
2. Validates the backup (checks for `.bson` files)
3. Logs the operation to `mongo_backups/backup.log`
4. Auto-deletes backups older than **7 days**

### Usage
```bash
bash mongodb_backup.sh
```

### Output
```
mongo_backups/
├── intern_db_backup_2026-02-18_13-20/
│   └── intern_db/
│       ├── users.bson
│       ├── users.metadata.json
│       ├── tasks.bson
│       └── tasks.metadata.json
└── backup.log
```

### Schedule with Cron (Optional)
Run daily at midnight:
```bash
crontab -e
# Add this line:
0 0 * * * /home/prerana/Desktop/Earth_s/project/mongodb_backup.sh
```

---

## Restore — `mongodb_restore.sh`

### What it does
1. Validates the backup path and `.bson` files exist
2. Runs `mongorestore` to import data back into `intern_db`
3. Optionally drops existing data before restoring (`--drop` flag)
4. Logs the operation

### Usage

**Merge restore** (keeps existing data, adds/updates from backup):
```bash
bash mongodb_restore.sh mongo_backups/intern_db_backup_2026-02-17_22-51/intern_db
```

**Drop and restore** (deletes existing data first):
```bash
bash mongodb_restore.sh --drop mongo_backups/intern_db_backup_2026-02-17_22-51/intern_db
```

**List available backups:**
```bash
bash mongodb_restore.sh
# Shows all backup directories
```

---

## Configuration

| Setting | Value | File |
|---------|-------|------|
| Database name | `intern_db` | Both scripts |
| Backup directory | `mongo_backups/` | Both scripts |
| Retention period | 7 days | `mongodb_backup.sh` |

---

## Prerequisites

Install MongoDB Database Tools:
```bash
sudo apt install mongodb-database-tools
```

Verify installation:
```bash
mongodump --version
mongorestore --version
```
