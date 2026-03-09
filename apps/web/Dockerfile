# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ui/package.json packages/ui/
COPY packages/schema/package.json packages/schema/
COPY apps/web/package.json apps/web/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ui/ packages/ui/
COPY packages/schema/ packages/schema/
COPY apps/web/ apps/web/

# VITE_API_URL is baked in at build time.
# Default: http://localhost:5000 (same-machine access).
# For LAN access from other devices, set to your machine's hostname or IP:
#   e.g. http://192.168.1.100:5000
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/apps/web
RUN pnpm build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
