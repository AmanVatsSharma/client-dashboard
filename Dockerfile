# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Install dependencies
# ──────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all deps (including devDeps needed for prisma generate + next build)
RUN npm ci

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — Build the application
# ──────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate only reads schema.prisma — it does NOT connect to the DB.
# A syntactically-valid placeholder URL is enough.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXTAUTH_SECRET="build-time-placeholder-not-used-at-runtime"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_TELEMETRY_DISABLED=1

# package.json build script already runs `prisma generate && next build`
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3 — Production runtime (minimal image)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Static assets and public files
COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

# Next.js standalone output (self-contained server.js + required node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

# Prisma schema + generated native query-engine binaries (required at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma                ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
