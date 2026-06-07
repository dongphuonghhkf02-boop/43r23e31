"""
customs_calculator.py — DM Auto under-key customs calculator.

Replaces the legacy "Europe → BY/RU" calculator. Computes import duties
for individuals importing passenger cars into Russia (RU) or Belarus (BY)
using age + engine displacement + vehicle price rules.

Endpoints (all under /api/customs/*):
  GET  /api/customs/tariffs                       — list all tariff config (public)
  POST /api/customs/compute                       — compute under-key price (public)
  GET  /api/customs/admin/tariffs                 — get full editable config (admin)
  PUT  /api/customs/admin/tariffs/{country}       — replace country tariff (admin)
  PUT  /api/customs/admin/services/{country}      — replace ancillary fees (admin)
  POST /api/customs/admin/tariffs/reset           — re-seed defaults (admin)

Storage: Mongo collection `customs_tariffs` keyed by {country}.

Default rates are derived from public Russian/Belarussian individual-import
tables (TKS, calcus, alta-customs). They can be edited from the admin UI
without redeploying. Routes selection (north Belarus / south Turkey-Georgia)
is based on engine size: ≤1.9 L → north; >1.9 L → south.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Body, Depends, Header
from pydantic import BaseModel, Field

from app.core.db_runtime import get_db

logger = logging.getLogger("bibi.customs_calculator")

router = APIRouter(prefix="/api/customs", tags=["customs-calculator"])


# ───────────────────────────────────────────────────────────────────
# Default tariff seed data (editable from admin afterwards).
# Rates expressed in EUR. Compatible with TKS / calcus references.
# ───────────────────────────────────────────────────────────────────
DEFAULT_TARIFFS: Dict[str, Dict[str, Any]] = {
    "ru": {
        "country": "ru",
        "label": "Russia",
        "currency": "EUR",
        # Cars younger than 3 years: ad-valorem with minimum €/cm³ floor.
        # price_brackets list is iterated in order; first match wins.
        "young_under_3y": {
            "price_brackets": [
                {"price_max": 8500,  "rate_pct": 54, "min_per_cc": 2.5},
                {"price_max": 16700, "rate_pct": 48, "min_per_cc": 3.5},
                {"price_max": 42300, "rate_pct": 48, "min_per_cc": 5.5},
                {"price_max": 84500, "rate_pct": 48, "min_per_cc": 7.5},
                {"price_max": 169000, "rate_pct": 48, "min_per_cc": 15.0},
                {"price_max": None,  "rate_pct": 48, "min_per_cc": 20.0},
            ],
        },
        # 3–5 year cars: pure €/cm³ ladder.
        "mid_3_to_5y": {
            "volume_brackets": [
                {"cc_max": 1000,  "eur_per_cc": 1.5},
                {"cc_max": 1500,  "eur_per_cc": 1.7},
                {"cc_max": 1800,  "eur_per_cc": 2.5},
                {"cc_max": 2300,  "eur_per_cc": 2.7},
                {"cc_max": 3000,  "eur_per_cc": 3.0},
                {"cc_max": None,  "eur_per_cc": 3.6},
            ],
        },
        # 5+ year cars: higher €/cm³ ladder.
        "old_over_5y": {
            "volume_brackets": [
                {"cc_max": 1000,  "eur_per_cc": 3.0},
                {"cc_max": 1500,  "eur_per_cc": 3.2},
                {"cc_max": 1800,  "eur_per_cc": 3.5},
                {"cc_max": 2300,  "eur_per_cc": 4.8},
                {"cc_max": 3000,  "eur_per_cc": 5.0},
                {"cc_max": None,  "eur_per_cc": 5.7},
            ],
        },
        # Recycling fee (утильсбор) base for individuals — RUB-equivalent
        # but normalised to EUR at ~0.01 EUR per RUB for the public-facing
        # estimate. Admin can override exact values.
        "recycling_fee": {
            "under_3y_under_3000cc": 32,    # personal use, base
            "under_3y_over_3000cc": 1100,
            "over_3y_under_3000cc": 53,
            "over_3y_over_3000cc": 1700,
        },
        # Ancillary fees (broker, СВХ, registration, service fee, etc.)
        "services": {
            "customs_clearance_fee": 60,     # тамож. сбор (€)
            "broker_fee": 250,
            "warehouse_fee": 150,            # СВХ
            "guarantee_fee": 80,             # обеспечение
            "sbkts_fee": 280,                # СБКТС
            "epts_fee": 60,                  # ЭПТС
            "registration_fee": 120,         # постановка на учёт
            "service_fee_dm": 950,           # сервисный сбор DM Auto
        },
        # Logistics
        "logistics": {
            "north_route": {                 # ≤1.9L: Germany → Poland → Belarus → RU
                "eu_inland": 550,
                "cross_border": 1300,
                "insurance_pct": 1.2,
                "insurance_min": 90,
                "local_delivery": 500,
                "label": "Германия → Польша → Беларусь → РФ",
            },
            "south_route": {                 # >1.9L: Germany → Turkey → Georgia → RU
                "eu_inland": 650,
                "cross_border": 1900,
                "insurance_pct": 1.4,
                "insurance_min": 120,
                "local_delivery": 700,
                "label": "Германия → Турция → Грузия → РФ",
            },
        },
    },
    "by": {
        "country": "by",
        "label": "Belarus",
        "currency": "EUR",
        # Belarus uses EAEU common tariff (similar to RU) — slight discount
        # versus RU on certain bands; admin can fine-tune.
        "young_under_3y": {
            "price_brackets": [
                {"price_max": 8500,  "rate_pct": 54, "min_per_cc": 2.5},
                {"price_max": 16700, "rate_pct": 48, "min_per_cc": 3.5},
                {"price_max": 42300, "rate_pct": 48, "min_per_cc": 5.5},
                {"price_max": 84500, "rate_pct": 48, "min_per_cc": 7.5},
                {"price_max": 169000, "rate_pct": 48, "min_per_cc": 15.0},
                {"price_max": None,  "rate_pct": 48, "min_per_cc": 20.0},
            ],
        },
        "mid_3_to_5y": {
            "volume_brackets": [
                {"cc_max": 1000,  "eur_per_cc": 1.5},
                {"cc_max": 1500,  "eur_per_cc": 1.7},
                {"cc_max": 1800,  "eur_per_cc": 2.5},
                {"cc_max": 2300,  "eur_per_cc": 2.7},
                {"cc_max": 3000,  "eur_per_cc": 3.0},
                {"cc_max": None,  "eur_per_cc": 3.6},
            ],
        },
        "old_over_5y": {
            "volume_brackets": [
                {"cc_max": 1000,  "eur_per_cc": 3.0},
                {"cc_max": 1500,  "eur_per_cc": 3.2},
                {"cc_max": 1800,  "eur_per_cc": 3.5},
                {"cc_max": 2300,  "eur_per_cc": 4.8},
                {"cc_max": 3000,  "eur_per_cc": 5.0},
                {"cc_max": None,  "eur_per_cc": 5.7},
            ],
        },
        "recycling_fee": {
            "under_3y_under_3000cc": 20,
            "under_3y_over_3000cc": 850,
            "over_3y_under_3000cc": 35,
            "over_3y_over_3000cc": 1300,
        },
        "services": {
            "customs_clearance_fee": 50,
            "broker_fee": 200,
            "warehouse_fee": 120,
            "guarantee_fee": 60,
            "sbkts_fee": 230,
            "epts_fee": 50,
            "registration_fee": 90,
            "service_fee_dm": 850,
        },
        "logistics": {
            "north_route": {
                "eu_inland": 500,
                "cross_border": 900,
                "insurance_pct": 1.0,
                "insurance_min": 80,
                "local_delivery": 350,
                "label": "Германия → Польша → Беларусь",
            },
            "south_route": {
                "eu_inland": 600,
                "cross_border": 1500,
                "insurance_pct": 1.3,
                "insurance_min": 100,
                "local_delivery": 500,
                "label": "Германия → Турция → Грузия → Беларусь",
            },
        },
    },
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _ensure_seeded() -> None:
    """Seed default tariffs into Mongo on first access."""
    db = get_db()
    coll = db.customs_tariffs
    for code, doc in DEFAULT_TARIFFS.items():
        existing = await coll.find_one({"country": code})
        if existing is None:
            await coll.insert_one({
                **doc,
                "_seeded_at": _now(),
                "_updated_at": _now(),
            })
            logger.info(f"[customs_calculator] Seeded default tariff for {code}")


async def _load_tariff(country: str) -> Dict[str, Any]:
    await _ensure_seeded()
    db = get_db()
    doc = await db.customs_tariffs.find_one({"country": country})
    if not doc:
        # Should not happen after seed; fall back to in-memory default.
        return DEFAULT_TARIFFS.get(country, DEFAULT_TARIFFS["ru"])
    doc.pop("_id", None)
    return doc


# ───────────────────────────────────────────────────────────────────
# Computation engine
# ───────────────────────────────────────────────────────────────────
def _age_years(year: int) -> float:
    """Vehicle age in years (decimal). Uses current calendar year - model year."""
    current = datetime.now(timezone.utc).year
    return max(0.0, float(current - int(year)))


def _pick_route(engine_cc: int) -> str:
    """Engine ≤1900cc → north (Belarus). Otherwise → south (Turkey/Georgia)."""
    return "north_route" if int(engine_cc) <= 1900 else "south_route"


def _compute_customs_duty(tariff: Dict[str, Any], age: float, engine_cc: int, price_eur: float) -> Dict[str, Any]:
    """Returns dict {duty, basis, eur_per_cc, rate_pct}."""
    cc = max(1, int(engine_cc))
    if age < 3:
        cfg = tariff["young_under_3y"]
        bracket = None
        for b in cfg["price_brackets"]:
            pmax = b.get("price_max")
            if pmax is None or price_eur <= pmax:
                bracket = b
                break
        if bracket is None:
            bracket = cfg["price_brackets"][-1]
        ad_valorem = price_eur * (bracket["rate_pct"] / 100.0)
        min_by_cc = cc * bracket["min_per_cc"]
        duty = max(ad_valorem, min_by_cc)
        return {
            "duty": round(duty, 2),
            "basis": "ad_valorem_with_min_per_cc",
            "rate_pct": bracket["rate_pct"],
            "min_per_cc": bracket["min_per_cc"],
            "ad_valorem": round(ad_valorem, 2),
            "min_by_cc": round(min_by_cc, 2),
        }
    elif age < 5:
        cfg = tariff["mid_3_to_5y"]
        eur_per_cc = cfg["volume_brackets"][-1]["eur_per_cc"]
        for b in cfg["volume_brackets"]:
            cm = b.get("cc_max")
            if cm is None or cc <= cm:
                eur_per_cc = b["eur_per_cc"]
                break
        duty = cc * eur_per_cc
        return {
            "duty": round(duty, 2),
            "basis": "per_cc_age_3_5",
            "eur_per_cc": eur_per_cc,
        }
    else:
        cfg = tariff["old_over_5y"]
        eur_per_cc = cfg["volume_brackets"][-1]["eur_per_cc"]
        for b in cfg["volume_brackets"]:
            cm = b.get("cc_max")
            if cm is None or cc <= cm:
                eur_per_cc = b["eur_per_cc"]
                break
        duty = cc * eur_per_cc
        return {
            "duty": round(duty, 2),
            "basis": "per_cc_age_5_plus",
            "eur_per_cc": eur_per_cc,
        }


def _recycling_fee(tariff: Dict[str, Any], age: float, engine_cc: int) -> float:
    rf = tariff.get("recycling_fee", {})
    if age < 3:
        return float(rf.get("under_3y_over_3000cc" if engine_cc > 3000 else "under_3y_under_3000cc", 0))
    return float(rf.get("over_3y_over_3000cc" if engine_cc > 3000 else "over_3y_under_3000cc", 0))


# ───────────────────────────────────────────────────────────────────
# Pydantic models
# ───────────────────────────────────────────────────────────────────
class ComputeRequest(BaseModel):
    country: str = Field(..., description="ru | by")
    vehicle_type: Optional[str] = Field("sedan", description="sedan | suv | pickup | van")
    year: int = Field(..., ge=1970, le=2100)
    fuel_type: Optional[str] = Field("petrol", description="petrol | diesel | hybrid | electric")
    engine_cc: int = Field(..., ge=0, le=10000, description="Engine displacement in cm³ (0 for electric)")
    price_eur: float = Field(..., ge=0)
    power_hp: Optional[int] = Field(None, ge=0, le=2000)


# ───────────────────────────────────────────────────────────────────
# Routes
# ───────────────────────────────────────────────────────────────────
@router.get("/tariffs")
async def list_tariffs() -> Dict[str, Any]:
    """Public read-only view of current tariff config (for transparency)."""
    await _ensure_seeded()
    db = get_db()
    docs = []
    async for d in db.customs_tariffs.find({}):
        d.pop("_id", None)
        docs.append(d)
    return {"tariffs": docs}


@router.post("/compute")
async def compute_quote(req: ComputeRequest) -> Dict[str, Any]:
    """Compute the under-key price for an imported car."""
    country = req.country.lower()
    if country not in ("ru", "by"):
        raise HTTPException(400, "country must be 'ru' or 'by'")
    tariff = await _load_tariff(country)

    age = _age_years(req.year)
    engine_cc = int(req.engine_cc)
    is_electric = (req.fuel_type or "").lower() == "electric"

    # Electric vehicles: duty waived / reduced. For estimate purposes use
    # zero duty + half recycling. Admin can later add a dedicated section.
    if is_electric:
        duty_info = {"duty": 0.0, "basis": "electric_exempt"}
        recycling = round(_recycling_fee(tariff, age, 0) * 0.5, 2)
    else:
        duty_info = _compute_customs_duty(tariff, age, engine_cc, req.price_eur)
        recycling = _recycling_fee(tariff, age, engine_cc)

    # Route based on engine
    route_key = _pick_route(0 if is_electric else engine_cc)
    route = tariff["logistics"][route_key]

    car_subtotal = float(req.price_eur)
    eu_inland = float(route["eu_inland"])
    cross_border = float(route["cross_border"])
    insurance = max(
        float(route["insurance_min"]),
        round(car_subtotal * (float(route["insurance_pct"]) / 100.0), 2),
    )
    local_delivery = float(route["local_delivery"])
    logistics_total = round(eu_inland + cross_border + insurance + local_delivery, 2)

    svc = tariff.get("services", {})
    broker = float(svc.get("broker_fee", 0))
    warehouse = float(svc.get("warehouse_fee", 0))
    guarantee = float(svc.get("guarantee_fee", 0))
    clearance = float(svc.get("customs_clearance_fee", 0))
    sbkts = float(svc.get("sbkts_fee", 0))
    epts = float(svc.get("epts_fee", 0))
    registration = float(svc.get("registration_fee", 0))
    service_fee_dm = float(svc.get("service_fee_dm", 0))

    customs_total = round(duty_info["duty"] + clearance + recycling + guarantee, 2)
    services_total = round(broker + warehouse + sbkts + epts + registration + service_fee_dm, 2)

    grand_total = round(car_subtotal + logistics_total + customs_total + services_total, 2)

    return {
        "country": country,
        "country_label": tariff.get("label", country.upper()),
        "currency": tariff.get("currency", "EUR"),
        "input": req.model_dump(),
        "age_years": age,
        "route": {
            "key": route_key,
            "label": route.get("label", ""),
        },
        "breakdown": {
            "car": {
                "price": car_subtotal,
            },
            "logistics": {
                "eu_inland": eu_inland,
                "cross_border": cross_border,
                "insurance": insurance,
                "local_delivery": local_delivery,
                "total": logistics_total,
            },
            "customs": {
                "duty": duty_info["duty"],
                "duty_basis": duty_info,
                "customs_clearance_fee": clearance,
                "recycling_fee": recycling,
                "guarantee_fee": guarantee,
                "total": customs_total,
            },
            "services": {
                "broker_fee": broker,
                "warehouse_fee": warehouse,
                "sbkts_fee": sbkts,
                "epts_fee": epts,
                "registration_fee": registration,
                "service_fee_dm": service_fee_dm,
                "total": services_total,
            },
        },
        "grand_total": grand_total,
        "computed_at": _now().isoformat(),
    }


# ─── Admin endpoints (no hard auth here — relies on global admin guards
#     elsewhere; can be wrapped with role-check middleware later) ───
@router.get("/admin/tariffs")
async def admin_list_tariffs() -> Dict[str, Any]:
    return await list_tariffs()


@router.put("/admin/tariffs/{country}")
async def admin_replace_tariff(country: str, body: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    country = country.lower()
    if country not in ("ru", "by"):
        raise HTTPException(400, "country must be 'ru' or 'by'")
    await _ensure_seeded()
    db = get_db()
    body = dict(body or {})
    body["country"] = country
    body["_updated_at"] = _now()
    await db.customs_tariffs.update_one(
        {"country": country},
        {"$set": body},
        upsert=True,
    )
    doc = await db.customs_tariffs.find_one({"country": country})
    if doc:
        doc.pop("_id", None)
    return {"ok": True, "tariff": doc}


@router.put("/admin/services/{country}")
async def admin_replace_services(country: str, body: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    country = country.lower()
    if country not in ("ru", "by"):
        raise HTTPException(400, "country must be 'ru' or 'by'")
    await _ensure_seeded()
    db = get_db()
    await db.customs_tariffs.update_one(
        {"country": country},
        {"$set": {"services": dict(body or {}), "_updated_at": _now()}},
        upsert=True,
    )
    doc = await db.customs_tariffs.find_one({"country": country})
    if doc:
        doc.pop("_id", None)
    return {"ok": True, "tariff": doc}


@router.post("/admin/tariffs/reset")
async def admin_reset_tariffs() -> Dict[str, Any]:
    db = get_db()
    await db.customs_tariffs.delete_many({})
    await _ensure_seeded()
    return await list_tariffs()
