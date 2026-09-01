# ─── Builder Stage ──────────────────────────────────────────────
FROM node:24-bookworm AS builder
WORKDIR /app

# 1. Copy only manifests first (maximises Docker layer caching)
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/ packages/

# 2. Install everything from root — npm workspaces resolve @repo/* links
RUN npm install

# 3. Prisma client generation must happen before the source build
COPY apps/api/prisma apps/api/prisma
RUN cd apps/api && npx prisma generate

# 4. Copy & build
COPY apps/api/tsconfig*.json apps/api/
COPY apps/api/src apps/api/src
COPY apps/api/scripts apps/api/scripts
COPY apps/api/nest-cli.json apps/api/
RUN cd apps/api && npm run build

# ─── Runtime Stage ─────────────────────────────────────────────
FROM node:24-bookworm-slim AS runtime
WORKDIR /app

# Prisma needs OpenSSL even at runtime — the slim image doesn't have it
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy only what's needed at runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/scripts ./apps/api/scripts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
RUN chmod +x ./apps/api/docker-entrypoint.sh

# The medicine catalog seed reads this file via a path relative to the repo
# root (../../../ from apps/api/prisma) — /app plays that role in the image.
COPY List_of_Items.xlsx ./List_of_Items.xlsx

EXPOSE 4000

# Run migrations, seed reference/demo data, then start the server.
# If seeding fails because the database's actual schema has drifted out of
# sync with the migration history (columns/tables missing despite
# `_prisma_migrations` claiming everything is applied), self-heal by
# resetting the database and reapplying migrations + seed from scratch —
# so a plain `docker compose up -d --build` recovers on its own.
WORKDIR /app/apps/api
CMD ["./docker-entrypoint.sh"]
