# Vedpragya Bharat Client Dashboard - Next.js 14

## Project Structure

```
vedpragya-dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── services/
│   │   │   │   └── page.tsx
│   │   │   ├── invoices/
│   │   │   │   └── page.tsx
│   │   │   ├── support/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [ticketId]/
│   │   │   │       └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── services/
│   │   │   │   └── route.ts
│   │   │   ├── invoices/
│   │   │   │   └── route.ts
│   │   │   ├── payments/
│   │   │   │   └── route.ts
│   │   │   └── tickets/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn/ui components)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── services/
│   │   ├── invoices/
│   │   ├── support/
│   │   └── layout/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── logo.png
├── package.json
├── next.config.js
├── tailwind.config.ts
## Tailwind CSS v4

Tailwind v4 is configured using CSS-first theming via `@theme` in `app/globals.css` and the official PostCSS plugin in `postcss.config.mjs`.

Quick checks:
- Ensure dependencies are installed: `tailwindcss@^4` and `@tailwindcss/postcss@^4`
- Import in CSS: `@import "tailwindcss";`
- Dev: `pnpm dev` and open the app; utilities should render

Note: If `pnpm` blocks native builds (`@tailwindcss/oxide`), Tailwind falls back to WASM automatically; no action required.

├── tsconfig.json
└── .env.example
```
