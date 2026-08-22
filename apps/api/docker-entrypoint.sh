#!/bin/sh
set -e

cd /app/apps/api

echo "[entrypoint] Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "[entrypoint] Migration failed — a prior migration attempt likely left the database in a"
  echo "[entrypoint] failed/partial state (Prisma error P3009)."
  echo "[entrypoint] Resetting the database and reapplying migrations + seed from scratch..."
  npx prisma migrate reset --force
  echo "[entrypoint] Starting server..."
  exec node dist/main.js
fi

echo "[entrypoint] Seeding database..."
if ! npx prisma db seed; then
  echo "[entrypoint] Seed failed — database schema is out of sync with migrations (drift)."
  echo "[entrypoint] Resetting the database and reapplying migrations + seed from scratch..."
  npx prisma migrate reset --force
fi

echo "[entrypoint] Starting server..."
exec node dist/main.js
