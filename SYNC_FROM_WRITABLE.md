# Canonical source tree

All Plan 2 work lives in **this directory** (`client-dashboard-writable`).  
If `../client-dashboard` is root-owned and your editor cannot save there, run once:

```bash
sudo chown -R "$USER:$USER" /path/to/client-dashboard
rsync -a --exclude node_modules --exclude .next --exclude .git \
  ./ /path/to/client-dashboard/
```

Then open `client-dashboard` as the workspace root and run `npm install && npm run build`.

`npm run lint` may prompt on first run if ESLint is not configured interactively; this repo already has `eslint.config.mjs` — use `npx eslint .` if needed.
