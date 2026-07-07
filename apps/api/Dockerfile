# ─── Builder Stage ──────────────────────────────────────────────
FROM node:24-bookworm AS builder
WORKDIR /app

# 1. Copy only manifests first (maximises Docker layer caching)
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/ packages/

# 2. Install everything from root — npm workspaces resolve @repo/* links
RUN npm ci

# 3. Prisma client generation must happen before the source build
COPY apps/api/prisma apps/api/prisma
RUN cd apps/api && npx prisma generate

# 4. Copy & build
COPY apps/api/tsconfig*.json apps/api/
COPY apps/api/src apps/api/src
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
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000

# Run migrations on startup, then start the server
WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
