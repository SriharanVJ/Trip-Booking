# Unified Booking Platform — Book Travels + Book Acting Driver

A single application hosting two products behind a shared landing page:

| App | URL | What it does |
|---|---|---|
| Landing | `/` | Choose an app ("Book Travels" or "Book Acting Driver") |
| **Book Travels** | `/travels/*` | Luxury vehicle fleet browsing, search, booking flow, admin console (gold/dark luxury theme) |
| **Book Acting Driver** | `/driver/*` | Driver partner onboarding, ride matching, driver + admin consoles (driver theme) |

One frontend process (TanStack Start), one backend process (FastAPI), one `.env`.

## Architecture

```
Browser ──► Vite/TanStack Start (:8080 dev)
              │   /            landing (shared entry point)
              │   /travels/*   travels SPA pages (src/travels, scoped via .travels-root)
              │   /driver/*    driver SPA pages  (src/driver)
              │
              ├── dev proxy ──► FastAPI (:8000)   services/api/main.py
              │                  /api/v1/*   travels backend (travels_api)
              │                  /api/*      driver backend  (driver_api)
              │                  /ws          driver websockets (ride matching)
              │                  /uploads    driver document uploads
              │
              └── PostgreSQL: vehicle_booking (travels), acting_driver (driver)
```

- Frontend: **TanStack Start** (React 19, Vite 8, Tailwind v4), file-based routing in `src/routes/`.
- Backend: **FastAPI** app in `services/api/main.py` mounting both legacy modules.
- Each app keeps its original look: travels.css is imported **only** in the
  `/travels` layout route and every rule is scoped under `.travels-root`, so the
  driver app and landing are untouched by it (and vice versa).

## Repository layout

```
src/
  routes/            TanStack file routes: index (landing), travels.tsx + travels/*, driver*
  travels/           Book Travels app (ported from the original Next.js app, see docs/travels)
    lib/navigation.ts  next/navigation-compatible shim; auto-prefixes /travels
    travels.css        route-scoped, .travels-root-scoped stylesheet
  driver/            Book Acting Driver app
  components/        shared/driver UI kit
  lib/               shared client libs
services/api/
  main.py            unified FastAPI entry (mounts both modules + ws + uploads)
  travels_api/       travels backend (/api/v1)
  driver_api/        driver backend  (/api, /ws)
  seed_db.py         travels DB seeder (vehicles, routes)
  .venv/             backend virtualenv
docs/
  travels/           archived travels docs (original README, API reference, design system)
  driver/            archived driver docs (README, API, roadmap)
legacy/              untouched copies of the two original repositories (archive)
```

## Prerequisites

- Node.js 20+
- Python 3.12/3.13 with the deps in `services/api/requirements.txt`
  (a ready virtualenv ships at `services/api/.venv`; a conda env `poc` also works)
- PostgreSQL with two databases:
  - `vehicle_booking` — travels
  - `acting_driver` — driver
  - see `DATABASE_URL` / `DRIVER_DATABASE_URL` in `.env.example`

## Quickstart

```bash
# 1. Environment
cp .env.example .env        # then fill in real values (SMTP creds, secrets)
                            # .env is gitignored — never commit it

# 2. Frontend deps
npm install

# 3. Backend virtualenv (if not using the bundled services/api/.venv)
python3 -m venv services/api/.venv
services/api/.venv/bin/pip install -r services/api/requirements.txt

# 4. Databases (once each)
cd services/api
alembic upgrade head                          # driver schema (alembic.ini in services/api)
.venv/bin/python seed_db.py                   # travels: vehicles + routes
.venv/bin/python -m driver_api.seed           # driver: pricing config + admin user
cd ../..
# (travels tables auto-create on backend startup — schema-as-code)

# 5. Run (two terminals)
npm run dev:api     # FastAPI on :8000 (or: services/api/.venv/bin/python -m uvicorn main:app --app-dir services/api --reload --port 8000)
npm run dev         # Vite dev server on :8080 — open http://localhost:8080
```

The driver admin login uses the seeded `ADMIN_PHONE` + OTP over SMTP.
Travels admin (`/travels/admin/*`) uses the travels auth endpoints.

## Production build

```bash
npm run build                                # default target: cloudflare-module (Lovable deploys)
NITRO_PRESET=node-server npm run build       # locally runnable Node server
node .output/server/index.mjs                # serves SSR + static assets
```

Notes:

- `vite preview` does **not** work with this scaffold (it expects a `dist/`
  layout that the nitro build doesn't produce).
- The dev proxy is dev-only. In production put a reverse proxy in front of the
  nitro server that forwards `/api`, `/uploads` and `/ws` to the FastAPI
  process (same routing as the dev proxy in `vite.config.ts`).
- Type checking: `npx tsc --noEmit` (the `build` script intentionally does not
  gate on it).

## Environment variables

One shared `.env` at the repo root; both backend modules read it (see
`.env.example` for every key with placeholders):

- Travels: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `BACKEND_CORS_ORIGINS`, …
- Driver: `DRIVER_DATABASE_URL`, `JWT_*`, `OTP_*`, `SMTP_*`, `TWILIO_*`, `MATCHING_*`, `ADMIN_*`, …
- Frontend: `VITE_API_ORIGIN` (dev proxy target), optional `VITE_TRAVELS_API_URL`.

## Manual steps / gotchas

1. **Create `.env` from `.env.example`** with real credentials — the seed
   scripts and both backend modules read it.
2. **Postgres**: create both databases and run the schema/seed commands above.
3. **Admin login**: driver admin needs the seeded admin phone; OTPs are
   delivered by the SMTP credentials in `.env` (codes are never echoed).
4. **Dead links kept on purpose**: a few links that were already dead in the
   original apps (travels footer About/Terms/Privacy/etc., admin booking and
   vehicle "detail" views, Admin "Reports") still point at non-existent pages
   and render the not-found screen — preserved as-is, typed via
   `deadRoute()` in `src/travels/lib/navigation.ts`.
5. **Travels vehicles page**: the upstream Next.js source shipped with a
   missing `<div>` (the page never compiled); a neutral wrapper was added —
   see the NOTE comment in `src/travels/app/(booking)/vehicles/page.tsx`.
6. **Deploy target**: `npm run build` defaults to the cloudflare-module preset
   (Lovable). Use `NITRO_PRESET=node-server` for a plain Node deployment.

## Original documentation

- Travels: `docs/travels/` (design system, original README, API reference)
- Driver: `docs/driver/` (README, API reference, roadmap)
- Archived source repos: `legacy/frontend-next` (travels) and the
  Acting-Driver checkout next to this repository (kept untouched).
