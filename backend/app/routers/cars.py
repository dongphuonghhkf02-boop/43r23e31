"""
cars — Admin-curated car catalog
=================================

The platform has pivoted **away from scraping / VIN-based ingestion**
toward a **fully admin-curated** showcase of vehicles.

A single admin user creates each car record by hand, uploads photos
and writes an "expert recommendation" note.  Public users browse a
flat curated list on the homepage (filtered only by budget bucket),
search by make/model in the header autocomplete, and click into a
detail page.  There is **no auction logic** here — every car carries
a single "all-inclusive approximate price".

Collection
----------
``cars`` (NEW — does not overlap with legacy ``wishlist_deals``)

::

    {
      _id, id (uuid str), slug,
      # Identity
      make, model, generation, year,
      title_ru, title_en,                # auto-generated if empty
      # Body
      body_type,                         # sedan | suv | wagon | ...
      color_name, color_hex,
      seats, doors,
      # Engine / drive
      engine_type,                       # petrol | diesel | hybrid | electric | gas
      engine_volume_l,                   # 2.0, 3.0, ...
      power_hp, power_kw,
      transmission,                      # manual | automatic | dct | cvt | robot
      drive,                             # fwd | rwd | awd | 4wd
      # Mileage / condition
      mileage_km,
      condition,                         # excellent | very_good | good | fair
      damage,                            # none | light | moderate | repaired
      accident_history (bool),
      service_history (str RU),
      # Pricing
      price_eur, currency,
      price_is_approximate (bool, always True),
      budget_bucket,                     # auto-computed
      # Admin recommendation
      admin_badge,                       # top_pick | best_price | underpriced | recommended | neutral
      admin_note_ru, admin_note_en,
      recommended (bool, default True),
      # Features / options
      options [str],                     # free-form tags ("Panorama roof", "AWD", ...)
      # Media
      main_image_url, gallery [str],
      video_url (str, optional),
      # Status
      published (bool, default False),
      sort_order (int),
      created_at, updated_at,
    }

Budget buckets (deterministic mapping from ``price_eur``):

* ``under_10k``   :  price <  10_000
* ``10_15k``      : 10_000 ≤ price < 15_000
* ``15_25k``      : 15_000 ≤ price < 25_000
* ``25_40k``      : 25_000 ≤ price < 40_000
* ``40_60k``      : 40_000 ≤ price < 60_000
* ``60k_plus``    : price ≥ 60_000

Routes
------
PUBLIC
  GET  /api/public/cars                  list (filter ?budget=&body=&page=)
  GET  /api/public/cars/search?q=        autocomplete (make/model substring)
  GET  /api/public/cars/buckets          counts grouped by budget bucket
  GET  /api/public/cars/{slug_or_id}     detail

ADMIN (require_admin)
  GET    /api/admin/cars                 list (incl. unpublished)
  POST   /api/admin/cars                 create
  GET    /api/admin/cars/{id}            detail
  PATCH  /api/admin/cars/{id}            update
  DELETE /api/admin/cars/{id}            hard delete (incl. image files)
  POST   /api/admin/cars/{id}/images     multipart upload (up to 20)
  DELETE /api/admin/cars/{id}/images     body: {url} → remove one image
  POST   /api/admin/cars/{id}/images/reorder   body: {gallery: [url, ...]}
  POST   /api/admin/cars/reorder         body: {order: [id, id, ...]}

Notes
-----
* Slugs are auto-generated from ``make-model-year-<6char>`` (uniqueness
  guaranteed by the suffix).
* Images live under ``static/cars/<car_id>/<uuid>.<ext>`` and are
  served via the existing ``/api/static`` and ``/static`` mounts.
* Legacy ``wishlist_deals`` endpoints remain in place — this module is
  additive and does not touch them.
"""
from __future__ import annotations

import logging
import os
import pathlib
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import (
    APIRouter,
    Body,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
)
from pydantic import BaseModel, Field

from security import require_admin

logger = logging.getLogger("bibi.cars")

# ─── Constants ────────────────────────────────────────────────────────
VALID_BODY_TYPES = {
    "sedan", "suv", "wagon", "hatchback", "coupe", "cabrio",
    "pickup", "minivan", "van", "motorbike", "crossover", "liftback",
}

VALID_ENGINE_TYPES = {"petrol", "diesel", "hybrid", "electric", "gas", "plugin_hybrid"}
VALID_TRANSMISSIONS = {"manual", "automatic", "dct", "cvt", "robot"}
VALID_DRIVES = {"fwd", "rwd", "awd", "4wd"}
VALID_CONDITIONS = {"excellent", "very_good", "good", "fair"}
VALID_DAMAGES = {"none", "light", "moderate", "repaired"}
VALID_ADMIN_BADGES = {
    "top_pick", "best_price", "underpriced",
    "recommended", "neutral", "rare_find", "low_mileage",
}

BUDGET_BUCKETS = (
    ("under_10k", 0,      10_000),
    ("10_15k",   10_000,  15_000),
    ("15_25k",   15_000,  25_000),
    ("25_40k",   25_000,  40_000),
    ("40_60k",   40_000,  60_000),
    ("60k_plus", 60_000,  10**12),
)
VALID_BUDGET_BUCKETS = {b[0] for b in BUDGET_BUCKETS}

MAX_GALLERY_IMAGES = 20
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_IMAGE_MIME = {
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
}
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

_STATIC_DIR = pathlib.Path(__file__).resolve().parents[2] / "static"
_CARS_DIR = _STATIC_DIR / "cars"
_CARS_DIR.mkdir(parents=True, exist_ok=True)


# ─── Helpers ──────────────────────────────────────────────────────────
def _db():
    from app.core.db_runtime import get_db
    return get_db()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: Optional[datetime]) -> Optional[str]:
    if not dt:
        return None
    if isinstance(dt, str):
        return dt
    return dt.replace(tzinfo=timezone.utc).isoformat() if dt.tzinfo is None else dt.isoformat()


def _budget_for(price_eur: Optional[float]) -> Optional[str]:
    if price_eur is None:
        return None
    try:
        p = float(price_eur)
    except (TypeError, ValueError):
        return None
    for bucket, lo, hi in BUDGET_BUCKETS:
        if lo <= p < hi:
            return bucket
    return "60k_plus"


_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _slugify(*parts: Any) -> str:
    raw = " ".join(str(p) for p in parts if p)
    raw = raw.lower().strip()
    raw = _SLUG_RE.sub("-", raw).strip("-")
    return raw or "car"


def _make_slug(make: str, model: str, year: Optional[int]) -> str:
    base = _slugify(make, model, year)
    suffix = uuid.uuid4().hex[:6]
    return f"{base}-{suffix}"


def _serialize(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Drop Mongo internals and stringify datetimes for JSON."""
    if not doc:
        return {}
    out = dict(doc)
    out.pop("_id", None)
    for k in ("created_at", "updated_at"):
        if k in out:
            out[k] = _iso(out.get(k))
    return out


def _coerce_float(v: Any) -> Optional[float]:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _coerce_int(v: Any) -> Optional[int]:
    if v is None or v == "":
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def _clean_list(v: Any) -> List[str]:
    if not v:
        return []
    if isinstance(v, str):
        return [s.strip() for s in v.split(",") if s.strip()]
    if isinstance(v, list):
        return [str(s).strip() for s in v if str(s).strip()]
    return []


# ─── Pydantic models ──────────────────────────────────────────────────
class CarPayload(BaseModel):
    # Identity
    make: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=120)
    generation: Optional[str] = Field(default=None, max_length=80)
    year: Optional[int] = Field(default=None, ge=1950, le=2100)
    title_ru: Optional[str] = Field(default=None, max_length=200)
    title_en: Optional[str] = Field(default=None, max_length=200)
    # Body
    body_type: Optional[str] = None
    color_name: Optional[str] = Field(default=None, max_length=60)
    color_hex: Optional[str] = Field(default=None, max_length=10)
    seats: Optional[int] = Field(default=None, ge=1, le=12)
    doors: Optional[int] = Field(default=None, ge=2, le=6)
    # Engine
    engine_type: Optional[str] = None
    engine_volume_l: Optional[float] = Field(default=None, ge=0, le=12)
    power_hp: Optional[int] = Field(default=None, ge=0, le=2500)
    power_kw: Optional[int] = Field(default=None, ge=0, le=2000)
    transmission: Optional[str] = None
    drive: Optional[str] = None
    # Mileage / condition
    mileage_km: Optional[int] = Field(default=None, ge=0, le=2_000_000)
    condition: Optional[str] = None
    damage: Optional[str] = None
    accident_history: Optional[bool] = False
    service_history: Optional[str] = Field(default=None, max_length=800)
    # Price
    price_eur: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default="EUR", max_length=8)
    price_is_approximate: Optional[bool] = True
    # Admin recommendation
    admin_badge: Optional[str] = "neutral"
    admin_note_ru: Optional[str] = Field(default=None, max_length=2000)
    admin_note_en: Optional[str] = Field(default=None, max_length=2000)
    recommended: Optional[bool] = True
    # Features
    options: Optional[List[str]] = None
    # Media
    main_image_url: Optional[str] = None
    gallery: Optional[List[str]] = None
    video_url: Optional[str] = None
    # Status
    published: Optional[bool] = False
    sort_order: Optional[int] = None


# ─── Validation helpers ───────────────────────────────────────────────
def _validate_enums(payload: Dict[str, Any]) -> None:
    def _check(field: str, allowed: set):
        v = payload.get(field)
        if v is not None and v != "" and v not in allowed:
            raise HTTPException(status_code=400, detail=f"Invalid {field}: {v}")

    _check("body_type", VALID_BODY_TYPES)
    _check("engine_type", VALID_ENGINE_TYPES)
    _check("transmission", VALID_TRANSMISSIONS)
    _check("drive", VALID_DRIVES)
    _check("condition", VALID_CONDITIONS)
    _check("damage", VALID_DAMAGES)
    _check("admin_badge", VALID_ADMIN_BADGES)


def _prepare_doc(payload: Dict[str, Any], *, existing: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Normalize a raw payload into a stored document."""
    doc = dict(existing or {})

    # Strings — copy through, treating None as "leave unchanged"
    for key in (
        "make", "model", "generation", "title_ru", "title_en",
        "body_type", "color_name", "color_hex",
        "engine_type", "transmission", "drive",
        "condition", "damage", "service_history",
        "currency", "admin_badge", "admin_note_ru", "admin_note_en",
        "main_image_url", "video_url",
    ):
        if key in payload:
            doc[key] = payload[key]

    # Numeric
    for key in ("seats", "doors", "power_hp", "power_kw", "mileage_km", "year", "sort_order"):
        if key in payload:
            doc[key] = _coerce_int(payload[key])
    for key in ("engine_volume_l", "price_eur"):
        if key in payload:
            doc[key] = _coerce_float(payload[key])

    # Booleans
    for key in ("accident_history", "price_is_approximate", "recommended", "published"):
        if key in payload:
            doc[key] = bool(payload[key])

    # Lists
    if "options" in payload:
        doc["options"] = _clean_list(payload["options"])
    if "gallery" in payload:
        doc["gallery"] = _clean_list(payload["gallery"])

    # Defaults for newly-created docs
    if not existing:
        doc.setdefault("currency", "EUR")
        doc.setdefault("price_is_approximate", True)
        doc.setdefault("admin_badge", "neutral")
        doc.setdefault("recommended", True)
        doc.setdefault("published", False)
        doc.setdefault("options", [])
        doc.setdefault("gallery", [])
        doc.setdefault("accident_history", False)

    # Auto title if missing
    if not doc.get("title_ru"):
        doc["title_ru"] = " ".join(
            str(x) for x in (doc.get("make"), doc.get("model"), doc.get("year")) if x
        ).strip()
    if not doc.get("title_en"):
        doc["title_en"] = doc.get("title_ru")

    # Auto-mirror main image to/from gallery
    gallery = doc.get("gallery") or []
    if not doc.get("main_image_url") and gallery:
        doc["main_image_url"] = gallery[0]
    if doc.get("main_image_url") and doc.get("main_image_url") not in gallery:
        # Place main image at the head of the gallery (idempotent)
        doc["gallery"] = [doc["main_image_url"]] + [g for g in gallery if g != doc["main_image_url"]]

    # Derived: budget_bucket
    doc["budget_bucket"] = _budget_for(doc.get("price_eur"))

    return doc


# ─── Index bootstrap ──────────────────────────────────────────────────
async def ensure_indexes() -> None:
    try:
        db = _db()
        col = db.cars
        await col.create_index("id", unique=True)
        await col.create_index("slug", unique=True, sparse=True)
        await col.create_index([("published", 1), ("sort_order", 1)])
        await col.create_index([("published", 1), ("budget_bucket", 1), ("sort_order", 1)])
        await col.create_index([("make", 1), ("model", 1)])
        # Text search on make / model / title for header autocomplete
        await col.create_index(
            [("make", "text"), ("model", "text"), ("title_ru", "text"), ("title_en", "text")],
            name="cars_text_idx",
            default_language="russian",
        )
        logger.info("[cars] indexes ensured")
    except Exception as e:
        logger.warning(f"[cars] index ensure failed: {e}")


# ─── Routers ──────────────────────────────────────────────────────────
public_router = APIRouter(prefix="/api/public/cars", tags=["public:cars"])
admin_router = APIRouter(prefix="/api/admin/cars", tags=["admin:cars"])


# ===== PUBLIC ============================================================
@public_router.get("")
async def public_list(
    budget: Optional[str] = Query(None),
    body: Optional[str] = Query(None),
    make: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(60, ge=1, le=120),
):
    """List published cars; supports budget / body / make filtering."""
    db = _db()
    q: Dict[str, Any] = {"published": True}
    if budget and budget in VALID_BUDGET_BUCKETS:
        q["budget_bucket"] = budget
    if body and body in VALID_BODY_TYPES:
        q["body_type"] = body
    if make:
        q["make"] = {"$regex": f"^{re.escape(make)}$", "$options": "i"}

    total = await db.cars.count_documents(q)
    cursor = (
        db.cars
        .find(q)
        .sort([("sort_order", 1), ("created_at", -1)])
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = [_serialize(d) async for d in cursor]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@public_router.get("/buckets")
async def public_buckets():
    """Counts grouped by budget bucket (for the filter chips on home)."""
    db = _db()
    pipeline = [
        {"$match": {"published": True}},
        {"$group": {"_id": "$budget_bucket", "count": {"$sum": 1}}},
    ]
    counts = {b[0]: 0 for b in BUDGET_BUCKETS}
    counts["all"] = 0
    total = 0
    async for row in db.cars.aggregate(pipeline):
        b = row.get("_id")
        c = int(row.get("count") or 0)
        if b in counts:
            counts[b] = c
        total += c
    counts["all"] = total
    return {"counts": counts, "total": total}


@public_router.get("/search")
async def public_search(
    q: str = Query("", min_length=0, max_length=80),
    limit: int = Query(10, ge=1, le=25),
):
    """Header autocomplete — substring match on make / model / title."""
    db = _db()
    if not q or len(q.strip()) < 2:
        return {"items": [], "query": q}
    needle = re.escape(q.strip())
    regex = {"$regex": needle, "$options": "i"}
    filt = {
        "published": True,
        "$or": [
            {"make": regex}, {"model": regex},
            {"title_ru": regex}, {"title_en": regex},
        ],
    }
    cursor = (
        db.cars.find(filt, projection={
            "id": 1, "slug": 1, "make": 1, "model": 1, "year": 1,
            "title_ru": 1, "title_en": 1, "main_image_url": 1,
            "price_eur": 1, "budget_bucket": 1, "_id": 0,
        })
        .sort([("sort_order", 1), ("created_at", -1)])
        .limit(limit)
    )
    items = [d async for d in cursor]
    # Also return a "make-bucket" hint for empty-state typeahead
    return {"items": items, "query": q}


@public_router.get("/{slug_or_id}")
async def public_detail(slug_or_id: str):
    """Resolve by slug first, then by id."""
    db = _db()
    doc = await db.cars.find_one({"slug": slug_or_id, "published": True})
    if not doc:
        doc = await db.cars.find_one({"id": slug_or_id, "published": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Car not found")

    # Fetch up to 4 "similar" cars from the same budget bucket (excluding self)
    similar: List[Dict[str, Any]] = []
    if doc.get("budget_bucket"):
        sim_cursor = (
            db.cars.find({
                "published": True,
                "budget_bucket": doc["budget_bucket"],
                "id": {"$ne": doc["id"]},
            })
            .sort([("sort_order", 1), ("created_at", -1)])
            .limit(4)
        )
        similar = [_serialize(d) async for d in sim_cursor]
    return {"car": _serialize(doc), "similar": similar}


# ===== ADMIN =============================================================
@admin_router.get("")
async def admin_list(
    user: dict = Depends(require_admin),
    include_unpublished: bool = Query(True),
    budget: Optional[str] = Query(None),
):
    db = _db()
    q: Dict[str, Any] = {}
    if not include_unpublished:
        q["published"] = True
    if budget and budget in VALID_BUDGET_BUCKETS:
        q["budget_bucket"] = budget
    cursor = db.cars.find(q).sort([("sort_order", 1), ("created_at", -1)])
    items = [_serialize(d) async for d in cursor]
    return {"items": items, "total": len(items)}


@admin_router.post("")
async def admin_create(
    payload: CarPayload,
    user: dict = Depends(require_admin),
):
    data = payload.model_dump(exclude_unset=True)
    _validate_enums(data)

    db = _db()
    doc = _prepare_doc(data)
    car_id = str(uuid.uuid4())
    slug = _make_slug(doc.get("make") or "car", doc.get("model") or "", doc.get("year"))
    now = _now()

    doc.update({
        "id": car_id,
        "slug": slug,
        "created_at": now,
        "updated_at": now,
    })
    # Default sort_order = current max + 1 (so new cars land at the end)
    if doc.get("sort_order") is None:
        max_doc = await db.cars.find_one(
            sort=[("sort_order", -1)],
            projection={"sort_order": 1, "_id": 0},
        )
        doc["sort_order"] = int((max_doc or {}).get("sort_order") or 0) + 1

    await db.cars.insert_one(doc)
    logger.info(f"[cars] created id={car_id} slug={slug} by={user.get('email')}")
    return _serialize(doc)


@admin_router.get("/{car_id}")
async def admin_detail(car_id: str, user: dict = Depends(require_admin)):
    db = _db()
    doc = await db.cars.find_one({"id": car_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Car not found")
    return _serialize(doc)


@admin_router.patch("/{car_id}")
async def admin_update(
    car_id: str,
    payload: CarPayload,
    user: dict = Depends(require_admin),
):
    data = payload.model_dump(exclude_unset=True)
    _validate_enums(data)

    db = _db()
    existing = await db.cars.find_one({"id": car_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Car not found")

    new_doc = _prepare_doc(data, existing=existing)
    new_doc["updated_at"] = _now()

    await db.cars.update_one({"id": car_id}, {"$set": new_doc})
    fresh = await db.cars.find_one({"id": car_id})
    return _serialize(fresh)


@admin_router.delete("/{car_id}")
async def admin_delete(car_id: str, user: dict = Depends(require_admin)):
    db = _db()
    existing = await db.cars.find_one({"id": car_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Car not found")
    # Delete on-disk images if they live under our static/cars/<id>/
    try:
        car_dir = _CARS_DIR / car_id
        if car_dir.exists() and car_dir.is_dir():
            for f in car_dir.iterdir():
                try:
                    f.unlink()
                except Exception:
                    pass
            car_dir.rmdir()
    except Exception as e:
        logger.warning(f"[cars] image cleanup failed for {car_id}: {e}")
    await db.cars.delete_one({"id": car_id})
    return {"ok": True, "deleted": car_id}


# ─── Image upload ─────────────────────────────────────────────────────
@admin_router.post("/{car_id}/images")
async def admin_upload_images(
    car_id: str,
    files: List[UploadFile] = File(...),
    user: dict = Depends(require_admin),
):
    """
    Multi-file upload (multipart/form-data, field name = ``files``).
    Stores up to 20 images per car.  Each file ≤ 8 MB, jpg/png/webp/gif.
    Returns the updated gallery list (URLs).
    """
    db = _db()
    car = await db.cars.find_one({"id": car_id})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    gallery: List[str] = list(car.get("gallery") or [])
    if len(gallery) >= MAX_GALLERY_IMAGES:
        raise HTTPException(status_code=400, detail="Gallery is full (max 20 images)")

    car_dir = _CARS_DIR / car_id
    car_dir.mkdir(parents=True, exist_ok=True)

    uploaded: List[str] = []
    for f in files:
        if len(gallery) >= MAX_GALLERY_IMAGES:
            break
        ct = (f.content_type or "").lower()
        ext = pathlib.Path(f.filename or "").suffix.lower()
        if ext not in ALLOWED_IMAGE_EXT and ct not in ALLOWED_IMAGE_MIME:
            raise HTTPException(status_code=400, detail=f"Unsupported image type: {f.filename}")
        if not ext:
            # Best-effort fallback from MIME
            ext = {
                "image/jpeg": ".jpg", "image/jpg": ".jpg",
                "image/png": ".png", "image/webp": ".webp",
                "image/gif": ".gif",
            }.get(ct, ".jpg")

        data = await f.read()
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Image too large: {f.filename} ({len(data)} bytes; max {MAX_IMAGE_BYTES})",
            )

        fname = f"{uuid.uuid4().hex}{ext}"
        fpath = car_dir / fname
        with open(fpath, "wb") as out:
            out.write(data)
        url = f"/api/static/cars/{car_id}/{fname}"
        gallery.append(url)
        uploaded.append(url)

    # Preserve first image as main if none was set
    main_image_url = car.get("main_image_url") or (gallery[0] if gallery else None)
    await db.cars.update_one(
        {"id": car_id},
        {"$set": {
            "gallery": gallery,
            "main_image_url": main_image_url,
            "updated_at": _now(),
        }},
    )
    fresh = await db.cars.find_one({"id": car_id})
    return {"uploaded": uploaded, "car": _serialize(fresh)}


@admin_router.delete("/{car_id}/images")
async def admin_remove_image(
    car_id: str,
    body: Dict[str, Any] = Body(...),
    user: dict = Depends(require_admin),
):
    """Remove a single image by URL. Body: ``{"url": "/api/static/cars/.../*.jpg"}``."""
    url = (body or {}).get("url")
    if not url:
        raise HTTPException(status_code=400, detail="Missing 'url'")

    db = _db()
    car = await db.cars.find_one({"id": car_id})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    gallery: List[str] = [u for u in (car.get("gallery") or []) if u != url]
    main = car.get("main_image_url")
    if main == url:
        main = gallery[0] if gallery else None

    # Delete file if it lives inside our managed folder
    try:
        prefix = f"/api/static/cars/{car_id}/"
        if url.startswith(prefix):
            fname = url[len(prefix):]
            fpath = _CARS_DIR / car_id / fname
            if fpath.exists():
                fpath.unlink()
    except Exception as e:
        logger.warning(f"[cars] failed to delete on-disk image {url}: {e}")

    await db.cars.update_one(
        {"id": car_id},
        {"$set": {"gallery": gallery, "main_image_url": main, "updated_at": _now()}},
    )
    fresh = await db.cars.find_one({"id": car_id})
    return _serialize(fresh)


@admin_router.post("/{car_id}/images/reorder")
async def admin_reorder_images(
    car_id: str,
    body: Dict[str, Any] = Body(...),
    user: dict = Depends(require_admin),
):
    """Set the new gallery order (first becomes main image)."""
    new_gallery = _clean_list((body or {}).get("gallery"))
    db = _db()
    car = await db.cars.find_one({"id": car_id})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    existing = set(car.get("gallery") or [])
    # Drop URLs not currently in the gallery (safety)
    new_gallery = [u for u in new_gallery if u in existing]
    main = new_gallery[0] if new_gallery else None

    await db.cars.update_one(
        {"id": car_id},
        {"$set": {"gallery": new_gallery, "main_image_url": main, "updated_at": _now()}},
    )
    fresh = await db.cars.find_one({"id": car_id})
    return _serialize(fresh)


@admin_router.post("/reorder")
async def admin_reorder_cards(
    body: Dict[str, Any] = Body(...),
    user: dict = Depends(require_admin),
):
    """Reorder cards on the homepage. Body: ``{"order": ["car_id", ...]}``."""
    order = (body or {}).get("order") or []
    if not isinstance(order, list):
        raise HTTPException(status_code=400, detail="Expected 'order': [id, ...]")

    db = _db()
    now = _now()
    updated = 0
    for i, car_id in enumerate(order):
        res = await db.cars.update_one(
            {"id": str(car_id)},
            {"$set": {"sort_order": i, "updated_at": now}},
        )
        updated += int(res.modified_count or 0)
    return {"ok": True, "updated": updated}
