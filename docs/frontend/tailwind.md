# Tailwind CSS v4 Setup & Troubleshooting

This project uses Tailwind CSS v4 with the CSS-first configuration.

## Architecture Flow

```mermaid
flowchart TD
  A[app/globals.css] -- @import tailwindcss --> B[@tailwindcss/postcss plugin]
  B --> C[Tailwind Engine]
  C --> D[Generated CSS]
  D --> E[Next.js App]
```

## Key Files
- `app/globals.css`: imports Tailwind and defines `@theme`, `@layer` rules
- `postcss.config.mjs`: loads `@tailwindcss/postcss`
- `tailwind.config.ts`: empty export (v4 uses CSS-first; keep for tooling)

## Verification Checklist
- Run `pnpm dev` and open the app
- Inspect `_next/static/css/app/layout.css` to see variables and layers
- Search for known utilities, e.g. `min-h-screen`, gradient classes

## Common Issues
- Missing deps: install `pnpm add -D tailwindcss @tailwindcss/postcss`
- PNPM blocked native builds: OK; Tailwind falls back to WASM
- No styles: ensure `@import "tailwindcss";` is at the top of `globals.css`


