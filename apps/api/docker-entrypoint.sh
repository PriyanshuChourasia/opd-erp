#!/bin/sh
set -e

cd /app/apps/api

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Seeding database..."
if ! npx prisma db seed; then
  echo "[entrypoint] Seed failed — database schema is out of sync with migrations (drift)."
  echo "[entrypoint] Resetting the database and reapplying migrations + seed from scratch..."
  npx prisma migrate reset --force
fi

echo "[entrypoint] Starting server..."
exec node dist/main.js
