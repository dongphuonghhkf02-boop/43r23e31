# plan.md — BIBI Cars: Admin‑Curated Catalog Pivot

## 1) Objectives
- Replace scraping/VIN-driven catalog with **admin-created car cards** (manual data + photo upload) and a **single curated list** displayed on Home.
- Remove public Catalog flow entirely; users browse only curated picks + car detail pages.
- Implement **budget-only filtering**, **header autocomplete** by make/model, and **CTA lead capture** when nothing matches.
- Redesign `SingleCarPage` to match **Welcome** styling (navy/cream/amber), RU+EN, mobile responsive.
- **Freeze parsers** (env flag + middleware block + UI hide) without deleting files.

## 2) Implementation Steps (Phased)

### Phase 1 — Core POC (prove the hardest workflow: admin creates a car with photos, public can view)
**POC scope (must be fully working before proceeding):**
1. Backend: create minimal `cars` collection + CRUD (create/list/detail) + image upload (multipart) + public read.
2. Frontend: minimal admin page `/admin/cars` (list + create modal) + photo upload; minimal public home block consuming `/api/public/cars`.
3. Verify full data flow: upload → store → serve URL → render images on card + detail.

**POC tasks**
- Backend
  - Add router `app/routers/cars.py`:
    - `POST /api/admin/cars` (create; published=false default)
    - `PATCH /api/admin/cars/{id}`
    - `DELETE /api/admin/cars/{id}`
    - `POST /api/admin/cars/{id}/images` (<=20 files; validate type/size)
    - `GET /api/public/cars` (list; filter `budget_bucket`; only `published=true`)
    - `GET /api/public/cars/{slug_or_id}` (detail)
  - Storage: reuse `uploads/` pattern from `content.py` (new folder `uploads/cars/`).
  - Budget buckets: implement deterministic mapping from `price_eur` (5–6 ranges) stored as `budget_bucket`.
- Frontend (POC UI)
  - Create `pages/admin/CarsAdminPage.jsx` with:
    - list view + “Create” modal (core fields + publish toggle)
    - image upload area (multi-upload; show thumbnails)
  - Refactor homepage curated block to call `/api/public/cars` and show `topN` cards.

**POC exit criteria**
- Admin can create a car, upload images, publish.
- Public home shows the car card with image; click opens detail endpoint and renders.

### Phase 2 — V1 App Development (build full curated experience)
1. **Data model (expand to “full info”)**
   - Extend `cars` schema to include full spec set (no auction fields, no VIN):
     - Identity: title_ru/en, make, model, generation, year
     - Body: body_type (full set), color_name, seats, doors
     - Engine/drive: engine_type, volume_l, power_hp, transmission, drive
     - Mileage/condition: mileage_km, condition, damage, accident_history, service_history
     - Price: `price_eur`, `price_is_approximate=true` (always shown)
     - Features: options/tags
     - Media: main_image + gallery[] + optional video_url
     - Admin recommendation: badge (`top_pick|best_price|underpriced|recommended|neutral`) + note_ru/note_en
     - Status: published, sort_order, created_at/updated_at
2. **Admin UI (production)**
   - Replace/retire VIN-based WishlistDeals admin UI (hide route).
   - Full editor with sections + RU/EN fields + sortable gallery + delete image.
   - Drag-and-drop reorder → `POST /api/admin/cars/reorder`.
3. **Public homepage**
   - Budget-only filter chips (5–6 buckets) with empty-state CTA.
   - CTA “Не нашли свой автомобиль?” opens lead form → POST `/api/leads`.
4. **Header search**
   - Autocomplete `/api/public/cars/search?q=` (substring over make/model/title).
   - No results → show CTA to lead form (pre-fill query).
5. **Catalog removal**
   - Remove `/catalog` route + files + menu links.
   - Add `Navigate` redirect `/catalog` → `/`.

**Phase 2 testing**
- One full E2E pass: admin creates 3 cars + reorder + publish; public filters by budget; search; open detail; submit lead.

### Phase 3 — SingleCarPage redesign + recommendations UX
1. Replace VIN-based `useCarByVin` with `useCarBySlugOrId` calling `/api/public/cars/{slug_or_id}`.
2. Redesign page to Welcome style:
   - Hero (main image, title, badge, approximate price)
   - Quick specs grid
   - Gallery (lightbox)
   - “Рекомендация эксперта” block (badge + RU/EN note)
   - Full specs + tags
   - CTA lead form section
   - Similar cars (same budget_bucket)
3. Mobile responsive + RU/EN.

### Phase 4 — Parser freeze + legacy cleanup (safe shutdown)
1. Implement `PARSERS_FROZEN=1` default:
   - Middleware blocks scraper/VIN endpoints when frozen (Ringostat pattern).
   - Startup skips scraper/enrichment workers when frozen.
2. UI: hide parser pages and VIN/search tooling.
3. Keep legacy endpoints mounted (but blocked) to avoid breaking old links.

## 3) Next Actions (immediate)
1. Implement Phase 1 POC backend router `cars.py` + uploads folder + list/detail endpoints.
2. Implement Phase 1 POC admin page `/admin/cars` + homepage block wired to `/api/public/cars`.
3. Seed 3 demo cars (admin UI) and verify images render on home.
4. Confirm budget buckets boundaries (final 5–6 ranges) before Phase 2.

## 4) Success Criteria
- Admin can fully manage curated cars (create/edit/delete/publish/reorder) and upload up to 20 images per car.
- Public sees curated list on Home, can filter only by budget, and can open a redesigned detail page.
- Header search suggests from curated cars; empty search drives to lead capture.
- `/catalog` removed with redirect; no broken nav.
- Parsers/VIN flows are frozen (non-operational) via env flag + UI hidden, without codebase deletions.

## User Stories (at least 5 per key phase)
**Phase 1 (POC)**
1. As an admin, I can create a car card with make/model/year/price so it exists in the system.
2. As an admin, I can upload multiple images and see thumbnails so I know they’ll display publicly.
3. As an admin, I can publish/unpublish a car so only approved picks show on Home.
4. As a user, I can see curated cars on Home so I can browse available picks.
5. As a user, I can open a car detail page so I can view the full information.

**Phase 2 (V1)**
1. As an admin, I can fill complete specs and a recommendation badge/note so the card feels expert‑curated.
2. As an admin, I can reorder cars so the most important ones appear first.
3. As a user, I can filter curated picks by budget so I only see options I can afford.
4. As a user, I can search “Audi” in the header and see suggestions so I can quickly find what’s shown.
5. As a user, if no results exist, I can submit a request to a manager so I can still get my desired car.

**Phase 3 (Detail redesign)**
1. As a user, I see a clear price (marked approximate) so I understand the cost expectation.
2. As a user, I can review an expert recommendation so I understand why this car is selected.
3. As a user, I can browse a gallery comfortably on mobile so I can assess condition.
4. As a user, I can view full specs in a structured way so I can compare cars.
5. As a user, I can submit a lead from the car page so I can get an individual calculation.
