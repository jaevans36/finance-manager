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

# ── Dev stage — Vite's own dev server, live source bind-mounted over /app at
# runtime (see docker-compose.dev.yml). node_modules stays inside the image
# (anonymous volume in the compose file) rather than syncing from the host.
FROM builder AS dev
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["pnpm", "dev", "--", "--host"]

# ── Prod build — forks from `builder` explicitly so `dev` (above) doesn't
# pull in the build step it doesn't need. ────────────────────────────────────
FROM builder AS build-prod

# VITE_API_URL and VITE_FINANCE_API_URL are baked in at build time.
# Default: http://localhost:5000 / http://localhost:5002 (same-machine access).
# For LAN access from other devices, set to your machine's hostname or IP:
#   VITE_API_URL: http://192.168.1.100:5000
# docker-compose.vps.yml already passes VITE_FINANCE_API_URL as a build arg, but
# Docker silently drops any build arg the Dockerfile doesn't declare with ARG —
# it never reached Vite, so the deployed app was always falling back to the
# finance-api-client.ts default of http://localhost:5002.
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_FINANCE_API_URL=http://localhost:5002
ENV VITE_FINANCE_API_URL=$VITE_FINANCE_API_URL

WORKDIR /app/apps/web
RUN pnpm build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=build-prod /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
