#!/bin/bash
# ============================================================
# mongodb_restore.sh — MongoDB Restore Script
# ============================================================
# Usage:
#   bash mongodb_restore.sh <backup_path>
#   bash mongodb_restore.sh --drop <backup_path>
#
# Examples:
#   # Restore (merge with existing data):
#   bash mongodb_restore.sh mongo_backups/intern_db_backup_2026-02-17_22-51/intern_db
#
#   # Restore (drop existing DB first, then restore):
#   bash mongodb_restore.sh --drop mongo_backups/intern_db_backup_2026-02-17_22-51/intern_db
#
# Arguments:
#   --drop        Optional. Drop existing collections before restoring.
#   <backup_path> Required. Path to the backup directory containing .bson files.
# ============================================================

# Configuration
DB_NAME="intern_db"
BACKUP_DIR="/home/prerana/Desktop/Earth_s/project/mongo_backups"
LOG_FILE="$BACKUP_DIR/backup.log"
DATE=$(date +"%Y-%m-%d_%H-%M")
DROP_FLAG=""

# ---- Parse arguments ----
if [ "$1" == "--drop" ]; then
    DROP_FLAG="--drop"
    RESTORE_PATH="$2"
    echo "[$DATE] ⚠️  WARNING: --drop flag set. Existing collections will be dropped before restore." | tee -a "$LOG_FILE"
else
    RESTORE_PATH="$1"
fi

# ---- Validate arguments ----
if [ -z "$RESTORE_PATH" ]; then
    echo "Usage: bash mongodb_restore.sh [--drop] <backup_path>"
    echo ""
    echo "Available backups:"
    ls -d "$BACKUP_DIR"/${DB_NAME}_backup_*/ 2>/dev/null | while read dir; do
        echo "  $(basename "$dir")/intern_db"
    done
    exit 1
fi

# ---- Validate backup path ----
if [ ! -d "$RESTORE_PATH" ]; then
    echo "[$DATE] ❌ ERROR: Backup path not found: $RESTORE_PATH" | tee -a "$LOG_FILE"
    exit 1
fi

BSON_COUNT=$(find "$RESTORE_PATH" -name "*.bson" 2>/dev/null | wc -l)
if [ "$BSON_COUNT" -eq 0 ]; then
    echo "[$DATE] ❌ ERROR: No .bson files found in: $RESTORE_PATH" | tee -a "$LOG_FILE"
    exit 1
fi

# ---- Confirm restore ----
echo "[$DATE] Starting restore of '$DB_NAME' from: $RESTORE_PATH" | tee -a "$LOG_FILE"
echo "[$DATE]    Collections found: $BSON_COUNT" | tee -a "$LOG_FILE"

# ---- Run mongorestore ----
mongorestore --db "$DB_NAME" $DROP_FLAG "$RESTORE_PATH" 2>&1
RESTORE_EXIT_CODE=$?

if [ $RESTORE_EXIT_CODE -ne 0 ]; then
    echo "[$DATE] ❌ ERROR: mongorestore failed with exit code $RESTORE_EXIT_CODE" | tee -a "$LOG_FILE"
    exit 1
fi

echo "[$DATE] ✅ Restore completed successfully" | tee -a "$LOG_FILE"
echo "---" >> "$LOG_FILE"
