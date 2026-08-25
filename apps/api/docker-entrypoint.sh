#!/bin/sh
set -e

cd /app/apps/api

echo "[entrypoint] Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "[entrypoint] Migration failed — resetting database and reapplying..."
  npx prisma migrate reset --force
fi

echo "[entrypoint] Seeding database with demo data (--fresh)..."
# Run seed directly via ts-node for reliability — bypasses prisma db seed
# wrapper which can have issues forwarding args in some environments.
if ! npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/seed.ts --fresh; then
  echo "[entrypoint] Seed failed — resetting database and re-seeding from scratch..."
  npx prisma migrate reset --force
  npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/seed.ts --fresh
fi

echo "[entrypoint] Ensuring uploads directory exists..."
mkdir -p /app/apps/api/uploads/documents
chmod -R 777 /app/apps/api/uploads 2>/dev/null || true

echo "[entrypoint] Starting server..."
exec node dist/main.js
