# AGENTS.md — InvenPro

## What is this

Inventory management prototype for a Colombian mini-market. Static frontend (React 18 + Babel in-browser transpilation) backed by Supabase. No build step, no bundler, no tests. Deployed on Vercel as a static site.

## Architecture (read this first)

**Two code coexist — understand which one you're editing:**

- **Legacy IIFE layer** (`data.js`, `models.js`): Self-contained IIFEs that define classes and attach everything to `window`. This is the version actually loaded by `index.html`.
- **ES modules layer** (`invenpro/domain.js`, `invenpro/services.js`, `invenpro/store.js`, `invenpro/bootstrap.js`): Cleaner refactored version under `window.InvenPro` namespace. Also loaded by `index.html`, but `bootstrap.js` only fills in if globals don't already exist (`if (!window.camelize)`, etc.).

**Result:** If `data.js` loaded first and set `window.camelize`, the `invenpro/bootstrap.js` copy is skipped. Edits to `invenpro/` code may have no visible effect unless `data.js` is also updated or removed.

**`src/` directory** contains a third, unbundled ES modules version (`src/main.js` imports `src/invenpro/`). It is NOT loaded by `index.html`. Treat `src/` as a future rewrite, not active code.

**Entry point:** `index.html` loads scripts in this exact order:
1. CDN libs (React, Babel, Tailwind, XLSX, html5-qrcode, Chart.js)
2. `supabase.lib.js` (minified Supabase UMD)
3. `supabase.js` (creates `window.db`)
4. `data.js` (all models, services, DataStore, EventBus, RealtimeManager, exports to `window`)
5. `invenpro/*.js` (domain, services, store, bootstrap — fills gaps only)
6. JSX components via `<script type="text/babel">`: ui → login → cashier → admin-* → admin → app → tweaks
7. `app.jsx` bootstraps React rendering

## Running locally

No build step. Serve the root directory with any static HTTP server:

```bash
# Any of these work:
npx serve .
python -m http.server 8000
# Vercel dev also works if you have the CLI
```

Open `http://localhost:8000` in browser. The app calls Supabase directly (credentials in `supabase.js`).

## Database

- **Supabase project:** `wwwfahcrwfowvnpusjbc.supabase.co`
- **Schema:** `schema.sql` — 14 tables, 2 RPC functions (`decrement_stock`, `increment_stock`)
- **Seed data:** `seed.sql` — 30 products, 5 users, 60+ invoices, etc. Base date hardcoded to `2026-05-08`
- **Migrations:** `supabase/migracion-nota-ingreso.sql`, `supabase/cron-alertas.sql` (run manually in SQL Editor)
- **Edge Function:** `supabase/functions/enviar-alerta/` — expiry alert notifications via pg_cron
- **RLS:** All tables have `allow_all` policies (academic project, no real auth restrictions)

## Key conventions

- **Language:** All UI text, variable names, and comments are in Spanish
- **Prices:** Integer COP (no decimals). Display via `window.fmtCOP()` → `"$12.345"`
- **Currency format:** `es-CO` locale
- **SKUs:** New products use `P-XXXXX` pattern (auto-generated via `ProductoService.generateSku()`)
- **Date format:** ISO strings (`YYYY-MM-DD`), times as `HH:MM` strings
- **CSS:** Tailwind with `tw-` prefix (`tailwind.config.prefix = 'tw-'`) to avoid conflicts with custom CSS in `styles.css` and `ecomoda.css`
- **Theme:** CSS custom properties (`--bg`, `--surface`, `--accent`, etc.), toggled via `data-theme` attribute on `<html>`
- **State:** `window.MOCK` (the DataStore) is the single source of truth for all data. Components read from it directly
- **Realtime:** WebSocket via `RealtimeManager` listens to all 10 Supabase tables, updates `window.MOCK` in-place, emits events via `window.EventBus`
- **Hydration:** On load, all data is fetched from Supabase with a 4s timeout per table. App renders even if Supabase is slow
- **Session persistence:** Login state stored in `localStorage` key `invenpro-session`
- **Auth:** SHA-256 hashing with auto-migration from legacy MD5 and plaintext passwords

## Common pitfalls

- **Duplicate class definitions:** `Producto`, `Usuario`, `Cajero`, etc. are defined in BOTH `data.js` AND `invenpro/domain.js`. The first one to run wins. If you add a method to `invenpro/domain.js` and it doesn't appear, `data.js` version is taking precedence.
- **`window.MOCK` vs `window._dataStore`:** Both point to the same DataStore instance. `window.MOCK` is the public alias. Don't create a second instance.
- **`window.DB` vs `window.db`:** `window.db` is the raw Supabase client. `window.DB` is the service layer (auth, productos, facturas, etc.). Don't confuse them.
- **`factura_items` vs `facturaItems`:** Supabase returns `factura_items` (snake_case). The DataStore maps it to `items` on the Factura instance (via `raw.items = raw.facturaItems`). Same for `ingreso_detalle` → `detalle`.
- **Script load order matters:** `data.js` must load before any JSX component that uses `window.MOCK`, `window.DB`, `camelize`, etc. Don't reorder scripts in `index.html` without understanding dependencies.
- **No transpilation step:** JSX files use `<script type="text/babel">` which Babel transpiles at runtime. There's no `.babelrc` or build config — Babel standalone uses default settings. This means no JSX support in `.js` files.
- **Dockerfile is a stub:** `FROM jsx` — not a real image. Don't use it.

## Deployment

- Vercel: `vercel.json` rewrites all routes to `index.html` (SPA fallback)
- No CI/CD, no lint, no typecheck, no test suite
- The `seed.sql` must be run manually against the Supabase SQL Editor to populate initial data
