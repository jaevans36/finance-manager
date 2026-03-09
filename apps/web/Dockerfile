# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# VERSION.json is at the repo root and imported by the app
COPY VERSION.json ./

# Copy all workspace package sources so pnpm can link them correctly
COPY packages/ packages/
COPY apps/web/ apps/web/

# Install all workspace dependencies (workspace symlinks need source to exist)
RUN pnpm install --frozen-lockfile

# VITE_API_URL is baked in at build time.
# Default: http://localhost:5000 (same-machine access).
# For LAN access from other devices, set to your machine's hostname or IP:
#   VITE_API_URL: http://192.168.1.100:5000
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/apps/web
RUN pnpm build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
