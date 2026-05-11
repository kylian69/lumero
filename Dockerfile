# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────
# Stage 1 : deps — install all dependencies (incl. dev for build)
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts && npx prisma generate

# ─────────────────────────────────────────────────────────────
# Stage 2 : builder — build Next.js in standalone mode
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p ./public && npm run build

# ─────────────────────────────────────────────────────────────
# Stage 3 : runner — minimal runtime image
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Full node_modules (overrides standalone's minimal tree). Required because the
# Prisma CLI used at startup for `migrate deploy` pulls in transitive deps
# (effect, @prisma/config, …) that the standalone trace does not include.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Prisma schema and migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

COPY --chown=nextjs:nodejs docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
