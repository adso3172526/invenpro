# AGENTS.md — InvenPro

POS + inventory web app for a Colombian minimarket (ADSO academic project). React 18, **no build step** — Babel Standalone, Tailwind and React are loaded from CDNs by `index.html` and everything runs in the browser.

## Run / verify
- No package.json, no build, no tests, no lint/typecheck, no CI. Verification is manual: serve the folder statically (`python -m http.server 8000`) and open `http://localhost:8000`.
- The app talks directly to the **live** Supabase project (real data). `supabase.js` holds URL + anon key.
- Deploy = git push; Vercel auto-deploys branches `main`/`dev`/`test` (SPA rewrite in `vercel.json`). `Dockerfile` is a stub, not used.

## Adding/extending UI (easy to get wrong)
- `index.html` wires everything via `<script>` tags in strict order: CDN libs → `supabase.js` → `data.js` → `facturacion/*` (contracts first, `composition.js` **last**) → babel-transpiled views (`ui.jsx` → `login.jsx` → `cashier.jsx` → `admin-utils.js` before `admin-*.jsx` → `admin.jsx` → `app.jsx` last).
- New component files MUST be added to `index.html` in the right position — nothing is auto-imported.
- All code is global scope (IIFEs assigning `window.X` or top-level consts). React-hook destructuring is namespaced per file (`useStateApp`, `useStateA`, `useMemoA`) to avoid collisions — keep this, no ES modules/imports.
- One Babel syntax error in any loaded `.jsx` breaks globals for every file loaded after it.
- New admin page = new `admin-*.jsx` + script tag + entry in the page switch in `app.jsx` + nav entry in `admin-utils.js`/`admin-sidebar.jsx`.

## Data layer (`data.js`; `models.js` is dead — not loaded anywhere, don't trust it)
- `window.MOCK` is the DataStore cache. Components **read** from `window.MOCK`; writes go through `window.DB.*` services to Supabase; Supabase Realtime patches `window.MOCK` and emits `realtime:<table>`. Components subscribe via `useRealtimeSync([...tables])` and re-read `window.MOCK`, ignoring event payloads — preserve that contract.
- DB is snake_case ↔ JS camelCase via `camelize`/`snakify`. Money = integer COP. `productos.sku` is TEXT (numeric-looking strings). Stock changes only through RPCs `decrement_stock`/`increment_stock`.
- `data.js` hardcodes `today = new Date(2026,4,8)`; `daysFromNow`/`todayStr` and dashboard "hoy" anchoring all pivot on it (seed data too, so vencimiento alerts line up).
- Login hashes passwords client-side (SHA-256), falls back to plaintext match and upgrades the stored hash. Demo users in `seed.sql`: `admin/admin123`, `supervisor/super123`, cajeros `*/cajero123`. Admin vs cashier view is decided by `rol`/`permisos` in `app.jsx`, not by selection.

## `facturacion/` module (POO+SOLID teaching artifact)
- One class per file, exported as `window.X` inside an IIFE. Strict load order in `index.html` (interfaces first).
- `composition.js` is the ONLY place `new` runs for this module and it overwrites `window.DB.facturas`; swapping provider/repo = changing one line there.
- `FacturacionService.generarId()` reads the max `F-####` id from the DB, **not** `window.MOCK` (realtime has dropped INSERTs before, leaving the cache stale). Keep that behavior.

## Supabase (schema + Edge Function)
- `schema.sql` + `seed.sql` recreate schema/RLS/seed (14 tables; RLS is allow-all — academic). Dashboards read SQL views `ventas_mes`, `ventas_cajero`, `top_productos`, `ventas_hoy`.
- `supabase/functions/enviar-alerta/index.ts` is a Deno/TS Edge Function sending Gmail email alerts. Deploy with `supabase functions deploy enviar-alerta`. Gmail credentials + alert config are read server-side from the `configuracion` table — never ship them in the client. Daily cron is set up once via `supabase/cron-alertas.sql`.

## Style/conventions
- UI text, comments, and commit messages are Spanish — keep it that way.
- Styling is Tailwind (CDN, prefix `tw-`, preflight off) + CSS custom-property tokens in `styles.css`. `ui.jsx` exports `<Icon>` and shared primitives. `tweaks.jsx` is a dev theming panel that applies inline token overrides (persists to localStorage `__tweaks_state`); its `TWEAK_DEFAULTS` must match the `styles.css` tokens.
- `gen_presentacion_pptx.py` / `gen_uml_pptx.py` generate course-deliverable `.pptx` (`pip install python-pptx`) — not app code.