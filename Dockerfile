# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
# Empty by design (single-origin: the browser fetches relative /api paths,
# proxied server-side to BACKEND_INTERNAL_URL below). A non-empty default
# here would bake an absolute dev-only address into every production
# bundle if a build-arg override is ever dropped — found live 2026-09-30:
# CI passed NEXT_PUBLIC_API_URL="" but the shipped image still had
# "http://localhost:8010" baked in, breaking every page's data fetch in
# production. Override locally via docker-compose or .env.local, never here.
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Rewrite destinations are compiled into the routes manifest AT BUILD TIME,
# so the proxy target must be baked here — the runtime env is too late.
# Default matches local compose (service "backend"); production passes
# http://rk-backend:8000 (the fixed container name on the droplet).
ARG BACKEND_INTERNAL_URL=http://backend:8000
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
