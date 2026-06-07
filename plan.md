# plan.md — BIBI / DM Auto: Admin‑Curated Catalog Pivot

## Status — 2026-06-07 (Deployment Resumed)
All four phases of the original plan have been implemented in the codebase that was
deployed today. Below is the verified mapping between the plan items and the live
code, followed by the final E2E testing handoff.

---

## ✅ Phase 1 — Core POC (DONE)
**Backend** — `backend/app/routers/cars.py` (775 lines) — fully implemented:
- POST /api/admin/cars, PATCH /api/admin/cars/{id}, DELETE /api/admin/cars/{id}
- POST /api/admin/cars/{id}/images (multipart, up to 20 images, 8 MB each)
- DELETE /api/admin/cars/{id}/images (single image)
- POST /api/admin/cars/{id}/images/reorder
- POST /api/admin/cars/reorder (homepage sort)
- GET /api/public/cars (with budget/body/make filter + pagination)
- GET /api/public/cars/search?q= (autocomplete)
- GET /api/public/cars/buckets (counts per bucket for filter chips)
- GET /api/public/cars/{slug_or_id} (detail + 4 similar cars)
- Deterministic budget bucket: under_10k / 10_15k / 15_25k / 25_40k / 40_60k / 60k_plus
- MongoDB indexes ensured at startup (server.py L3127–L3133)
- Router mounted in server.py L4390–L4391
- Static images served via /api/static/cars/<car_id>/<uuid>.<ext>

**Frontend** — `frontend/src/pages/admin/CarsAdminPage.jsx` (1095 lines) — full admin UI
with create/edit/delete, multi-image upload with reorder, publish toggle and DnD
homepage reorder. Route wired in App.js (`/admin/cars`).

**Verified (curl)** — admin login → create Audi A6 2022 → publish → `GET /api/public/cars`
returns the record with computed budget_bucket="25_40k" and auto-generated slug.

---

## ✅ Phase 2 — V1 App (DONE)
- Admin sidebar (`components/Layout.js`) shows ONLY: Панель, Клиенты, Калькулятор,
  Каталог авто, Уведомления, Настройки. The old "Подборка недели" / "VIN parsers"
  / "Source health" entries are gone; their routes redirect to `/admin` (App.js).
- `WishlistDealsAdminPage` retained on disk but its route now Navigate-redirects to
  `/admin/cars`.
- Image upload + DnD reorder gallery + DnD reorder homepage all wired.

## ✅ Phase 3 — Curated home experience (DONE)
- `figma_home/components/frame-component21.jsx` — consumes `/api/public/cars`,
  budget-filter aware, 9-card initial render with "show more / show less", empty-state
  CTA to GetInTouch modal, persistent "Не нашли свой автомобиль?" banner.
- `figma_home/components/frame-component20.jsx` — 7 budget chips
  (ALL / <10K / 10-15K / 15-25K / 25-40K / 40-60K / 60K+).
- `components/public/CarSearchDropdown.jsx` — header autocomplete hitting
  `/api/public/cars/search`, mini-card list, fallback CTA "Связаться с менеджером
  для подбора <query>" opening GetInTouch with `car_preference` pre-filled.
- /catalog route in App.js redirects to "/".

## ✅ Phase 4 — SingleCarPage redesign (DONE)
- `pages/public/SingleCarPage/SingleCarPage.jsx` (692 lines) + `SingleCarWelcome.module.css`
  — Welcome-style hero (navy/cream/amber), badge chip, breadcrumb, "Approximate price"
  disclaimer, quick-specs grid, gallery with lightbox, "Рекомендация эксперта" block
  using `admin_note_ru`/`admin_note_en`, full specs grouped by section, options chips,
  "Хотите этот автомобиль?" CTA, Similar cars row.
- New `useCarBySlugOrId.js` hook calling `/api/public/cars/{slug_or_id}`.
- RU + EN, mobile responsive verified via screenshot at 1920×800.

## ✅ Phase 5 — Parser freeze (DONE)
- `PARSERS_ENABLED` env flag — unset by default → PARSERS_FROZEN=True
  (server.py L3530). Endpoint middleware blocks scraper/VIN routes.
- All parser pages (ParserControl, ProxyManager, ParserLogs, ParserSettings,
  ParserTestLab, SourceHealthDashboard, VinEngineDashboard, RingostatAdminPage)
  retained on disk but their routes Navigate-redirect to `/admin`.
- Sidebar entries removed.

---

## Phase 7 — Final E2E test (DONE)
Tested via `testing_agent_v3`. Results:
- **Backend: 100%** — all 11 endpoints (login, create/update/delete car, public list,
  search, buckets, detail, reorder, auth-guard) pass.
- **Frontend: 95%** — 1 MEDIUM bug found: search suggestions weren't clickable due to
  `transform: scale()` on `ScaledChrome` creating a containing block that trapped the
  dropdown's z-index, allowing `.heroContent { isolation: isolate }` to paint over it.

### Post-test fix (DONE)
- `frontend/src/components/public/ScaledChrome.jsx` — added `zIndex: 100` and explicit
  `position: relative` to the outer wrapper. Re-verified via Playwright:
  - Search "audi" → dropdown shows on top of hero, clicking suggestion navigates to
    `/cars/audi-a6-2022-c3aa89` ✓
  - Search "lambo" → empty-state CTA opens GetInTouchModal (`FORM.git2-form`) ✓
  - Home deal card "MORE DETAILS" → navigates to detail page ✓
- `frontend/src/figma_home/components/header1.module.css` — also bumped
  `.header` from `z-index: 5` to `z-index: 50` + `position: relative` for cleaner
  stacking; both fixes together make the dropdown-over-hero interaction robust.

## Test credentials
- Admin: `admin@bibi.cars` / `Jp3FS_7ZuE2bhHp7rFkJm9B9T_TeiHxu`
- Customer (seeded): `user@bibi.cars` / `User_bibi_2026!`
- Customer (test bypass): `test@customer.com` / `test123`

## API Base
- Preview URL: https://car-rental-26.preview.emergentagent.com
- Local backend: http://localhost:8001 (FastAPI)
- Local frontend dev: http://localhost:3000 (craco)

