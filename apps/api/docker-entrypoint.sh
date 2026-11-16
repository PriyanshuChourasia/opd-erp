#!/bin/sh
set -e

cd /app/apps/api

# ─── Pre-deploy database backup ─────────────────────────────────────
# The migrate/seed steps below can (only when ALLOW_DESTRUCTIVE_RESET=true)
# SELF-HEAL with `prisma migrate reset --force`, which drops and recreates
# the whole database. Take a pg_dump
# snapshot BEFORE anything destructive can run, on EVERY container start
# (including crash-restarts), so a bad push is always recoverable.
# Backups land on the `db_backups` named volume (mounted here at
# $BACKUP_DIR by docker-compose.yml) — see DB_BACKUP_RESTORE.md at the
# repo root for restore instructions.
BACKUP_DIR="${BACKUP_DIR:-/app/apps/api/backups}"
BACKUP_KEEP="${BACKUP_KEEP:-24}"   # keep the N most recent dumps

# DATABASE_URL carries a ?schema=public query param that libpq/pg_dump do
# not understand — strip everything from the first '?' before connecting.
BACKUP_DB_URL="$(printf '%s' "$DATABASE_URL" | sed 's/?.*//')"
BACKUP_DB_NAME="$(printf '%s' "$BACKUP_DB_URL" | sed -n 's#.*/\([^/]*\)$#\1#p')"
BACKUP_FILE="$BACKUP_DIR/${BACKUP_DB_NAME}_$(date -u +%Y%m%dT%H%M%SZ).dump"

if [ -z "$BACKUP_DB_URL" ]; then
  echo "[entrypoint] FATAL: DATABASE_URL is not set — cannot back up." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
echo "[entrypoint] Taking pre-deploy database backup -> $BACKUP_FILE"
if ! pg_dump -Fc -f "$BACKUP_FILE" "$BACKUP_DB_URL"; then
  echo "[entrypoint] FATAL: pre-deploy database backup FAILED." >&2
  echo "[entrypoint] Refusing to migrate/seed/reset without a restorable backup — aborting startup." >&2
  exit 1
fi
echo "[entrypoint] Backup complete: $BACKUP_FILE"

# Retention: prune to the $BACKUP_KEEP most recent dumps (only after a
# successful backup, so we never delete the last good snapshot first).
ls -1t "$BACKUP_DIR"/*.dump 2>/dev/null \
  | tail -n +"$((BACKUP_KEEP + 1))" \
  | while IFS= read -r old; do rm -f "$old"; echo "[entrypoint] Pruned old backup: $old"; done

echo "[entrypoint] Applying database migrations..."
# Destructive self-heal (drop + recreate the whole DB) is OPT-IN only.
# Default: a failed migrate/seed stops the container and leaves the data
# untouched — a crash-loop must never repeatedly wipe a production database
# (and rotate the good pre-reset backups out of retention). Set
# ALLOW_DESTRUCTIVE_RESET=true only on a throwaway/dev database.
ALLOW_DESTRUCTIVE_RESET="${ALLOW_DESTRUCTIVE_RESET:-false}"

if ! npx prisma migrate deploy; then
  if [ "$ALLOW_DESTRUCTIVE_RESET" = "true" ]; then
    echo "[entrypoint] Migration failed — ALLOW_DESTRUCTIVE_RESET=true, resetting database and reapplying..."
    npx prisma migrate reset --force
  else
    echo "[entrypoint] Migration failed — NOT resetting (ALLOW_DESTRUCTIVE_RESET is not true). Data left untouched; fix the migration and redeploy. Backup: $BACKUP_FILE" >&2
    exit 1
  fi
fi

echo "[entrypoint] Seeding database (safe/additive — adds missing reference & demo rows, never deletes existing data)..."
# Run seed directly via ts-node for reliability — bypasses prisma db seed
# wrapper which can have issues forwarding args in some environments.
# Deliberately NOT --fresh here: this runs on every container start
# (including crash-restarts), and this may be a database with real data in
# it — --fresh wipes the whole database first. Each seed function already
# skips itself once its table has rows, so this is safe to rerun any number
# of times. Only the failure path below (schema drift severe enough that
# seeding itself errors) escalates to a full destructive reset.
if ! npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/seed.ts; then
  if [ "$ALLOW_DESTRUCTIVE_RESET" = "true" ]; then
    echo "[entrypoint] Seed failed — ALLOW_DESTRUCTIVE_RESET=true, resetting database and re-seeding from scratch (--fresh)..."
    npx prisma migrate reset --force
    npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/seed.ts --fresh
  else
    echo "[entrypoint] Seed failed — NOT resetting (ALLOW_DESTRUCTIVE_RESET is not true). Data left untouched; usually schema drift (a schema.prisma change with no migration). Backup: $BACKUP_FILE" >&2
    exit 1
  fi
fi

echo "[entrypoint] Starting server..."
exec node dist/main.js
