# ─── Builder Stage ──────────────────────────────────────────────
FROM node:24-bookworm AS builder
WORKDIR /app

# 1. Copy manifests only (caching)
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/clinic-ui/package.json apps/clinic-ui/package.json
COPY packages/typescript-config packages/typescript-config
COPY packages/eslint-config packages/eslint-config

# 2. Install — workspace deps are available for tsc --noEmit
RUN npm ci

# 3. Copy source and build
COPY apps/clinic-ui/ apps/clinic-ui/
WORKDIR /app/apps/clinic-ui
RUN npm run build

# ─── Runtime Stage (Nginx) ─────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Copy the built static files
COPY --from=builder /app/apps/clinic-ui/dist /usr/share/nginx/html

# Custom Nginx config: SPA fallback + API proxy to backend
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — all non-file routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the backend service
    location /api/ {
        proxy_pass http://api:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
