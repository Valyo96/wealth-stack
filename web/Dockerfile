# Build from repository root: docker compose -f deploy/docker-compose.yml build web
FROM node:20-alpine AS builder
WORKDIR /app

# Workspace install (root lockfile; all workspace package.json files required)
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY web/package.json ./web/
COPY mobile/package.json ./mobile/

RUN npm ci --include=optional

COPY packages/shared ./packages/shared
COPY web ./web

RUN npm run build -w @wealth-stack/shared

# Build from repo root so Rollup optional deps (linux-musl) resolve via hoisted node_modules
ENV VITE_API_BASE_URL=
RUN npm run build -w wealth-stack-web

FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/web/dist /usr/share/nginx/html
EXPOSE 80
