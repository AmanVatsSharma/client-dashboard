# Vedpragya client dashboard

Next.js 14 (App Router) client portal: services, invoices, support tickets, profile. Stack: **PostgreSQL**, **Prisma**, **NextAuth** (credentials + JWT session), **Tailwind CSS v4**, **Radix UI**.

## Layout (actual paths)

- `app/` — routes and API route handlers (`app/api/**/route.ts`)
- `components/` — `components/ui/*`, `components/dashboard/*`, `providers.tsx`
- `lib/` — `auth.ts`, `db.ts`, `utils.ts`, `activity-log.ts` (server writes), display helpers
- `prisma/schema.prisma` — data model
- `types/` — shared TS types, NextAuth module augmentation

There is **no** `src/` directory; `@/*` maps to the repo root (`tsconfig.json`).

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `NEXTAUTH_URL` | Public app URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Secret for JWT signing (required in production) |

Optional for seed:

| Variable | Default |
|----------|---------|
| `SEED_USER_EMAIL` | `demo@vedpragya.local` |
| `SEED_USER_PASSWORD` | `DemoPass123!` |

## Scripts

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed    # requires DATABASE_URL; uses tsx via devDependency
npm run dev
npm run build
npm run lint
npm run test       # vitest unit tests
```

## API route map (session-backed unless noted)

| Method | Path | Notes |
|--------|------|--------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth |
| POST | `/api/auth/signup` | Public registration |
| GET, POST | `/api/services` | User’s services (+ counts) |
| GET, POST | `/api/invoices` | List / create |
| GET, PATCH | `/api/invoices/[invoiceId]` | One invoice; PATCH mark paid / cancel |
| GET, POST | `/api/tickets` | Tickets |
| GET | `/api/tickets/[ticketId]` | Ticket + messages |
| POST | `/api/tickets/[ticketId]/messages` | Client reply |
| GET | `/api/activity` | Activity log (`take`, `skip`) |
| PATCH | `/api/user/profile` | Name, company, phone |
| POST | `/api/user/password` | Change password |

## App routes

- `/`, `/login`, `/signup`
- `/dashboard`, `/dashboard/services`, `/dashboard/invoices`, `/dashboard/support`, `/dashboard/support/[ticketId]`, `/dashboard/profile`

## Middleware

`middleware.ts` protects `/dashboard/*` with NextAuth JWT. API routes enforce the session inside each handler and return `401` JSON when unauthenticated.

## Tests

`tests/*.test.ts` — Vitest, pure logic (invoice transitions, Zod schemas). Run `npm run test`.

## Syncing to another checkout

If another folder (e.g. a root-owned clone) cannot be edited from your IDE, copy from this tree:

```bash
rsync -a --exclude node_modules --exclude .next --exclude .git ./ /path/to/target/
```

Then run `npm install` and `npm run build` in the target.
