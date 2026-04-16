# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vedpragya Client Dashboard — a Next.js 14 (App Router) client portal for managing services, invoices, support tickets, and user profiles. Two-role system: **ADMIN** (internal staff) and **CLIENT** (company members).

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # prisma generate && next build
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npm run test:watch   # Vitest in watch mode
npx vitest run tests/invoice-transitions.test.ts  # Run a single test file

# Database
npm run db:push      # Push schema to DB (prisma db push)
npm run db:seed      # Seed demo data (tsx prisma/seed.ts)

# Docker (full stack: Postgres + migrations + app)
docker compose up --build
```

## Architecture

**No `src/` directory.** The `@/*` path alias maps to the repo root.

### Routing & Auth

- `app/dashboard/*` — Client-facing pages (services, invoices, support, profile, payments, messages, notes, updates)
- `app/admin/*` — Admin pages (companies, invoices, tickets, bank accounts, messages, notes, updates)
- `app/(auth)/*` — Login/signup (route group, no layout segment)
- `app/api/*` — REST API route handlers; each handler enforces its own session check and returns 401 JSON when unauthenticated
- `middleware.ts` — NextAuth JWT middleware on `/dashboard/*` and `/admin/*`; redirects admins away from `/dashboard` and non-admins away from `/admin`

### Auth Flow

NextAuth with credentials provider + JWT sessions (no database sessions). The JWT carries `role`, `companyId`, `companyName`, `companyRole`, and `jobTitle` — see `types/next-auth.d.ts` for the module augmentation.

### Data Layer

- `prisma/schema.prisma` — PostgreSQL, all models (User, Company, CompanyUser, Service, Invoice, Ticket, PaymentProof, DirectMessage, ClientUpdate, Note, ActivityLog)
- `lib/db.ts` — Singleton PrismaClient (global cache in dev)
- `lib/admin-guard.ts` — `requireAdmin()` / `requireClient()` helpers for API routes; `requireClient()` also extracts `companyId`

### Key Patterns

- **Company-scoped data**: Clients belong to companies via `CompanyUser`. All client data queries filter by `session.user.companyId`.
- **Invoice state machine**: `lib/invoice-transitions.ts` — pure function `resolveInvoicePatch()` governs valid status transitions (PENDING/OVERDUE -> PAID, PENDING -> CANCELLED). Tested in `tests/invoice-transitions.test.ts`.
- **Zod validation**: API request schemas live in `lib/schemas/api.ts`.
- **Activity logging**: `lib/activity-log.ts` records user actions server-side.
- **Display helpers**: `lib/invoice-display.ts`, `lib/service-display.ts`, `lib/ticket-display.ts` — formatting/label helpers for the UI.

### Frontend

- Tailwind CSS v4, Radix UI primitives (`components/ui/*`), Lucide icons, Framer Motion
- `components/providers.tsx` wraps the app in `SessionProvider` + `ThemeProvider` (light/dark via next-themes)
- `components/dashboard/*` — client-facing components; `components/admin/*` — admin components

### Build & Deploy

- `next.config.js` uses `output: 'standalone'` for Docker
- Multi-stage Dockerfile (deps -> build -> minimal runtime with non-root user)
- `docker-compose.yml` orchestrates Postgres + one-shot migration/seed + app

## Environment Variables

Required: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`

Optional (seed): `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`

See `.env.example` for reference.
