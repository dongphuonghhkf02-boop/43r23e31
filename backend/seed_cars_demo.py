"""
Seed 3 demo curated cars directly into MongoDB. Idempotent — checks for
existing slugs before inserting.

Run with:
    cd /app/backend && python seed_cars_demo.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


def budget_for(p):
    if p < 10000: return "under_10k"
    if p < 15000: return "10_15k"
    if p < 25000: return "15_25k"
    if p < 40000: return "25_40k"
    if p < 60000: return "40_60k"
    return "60k_plus"


DEMOS = [
    {
        "make": "Audi",
        "model": "A6",
        "year": 2021,
        "title_ru": "Audi A6 Quattro 2021",
        "title_en": "Audi A6 Quattro 2021",
        "body_type": "sedan",
        "color_name": "Серый",
        "seats": 5,
        "doors": 4,
        "engine_type": "diesel",
        "engine_volume_l": 3.0,
        "power_hp": 286,
        "transmission": "automatic",
        "drive": "awd",
        "mileage_km": 42000,
        "condition": "excellent",
        "damage": "none",
        "accident_history": False,
        "service_history": "Полная история обслуживания у официального дилера",
        "price_eur": 38500,
        "price_is_approximate": True,
        "admin_badge": "top_pick",
        "admin_note_ru": "Один из самых сбалансированных бизнес-седанов в этом бюджете. Диагностика проведена, рекомендуем к покупке.",
        "admin_note_en": "One of the most balanced executive sedans in this budget. Inspected and ready to ship.",
        "recommended": True,
        "options": ["Панорамная крыша", "Адаптивный круиз", "Кожаный салон", "Подогрев сидений", "Memory pack"],
        "main_image_url": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
        ],
        "published": True,
        "sort_order": 1,
    },
    {
        "make": "BMW",
        "model": "X5",
        "year": 2020,
        "title_ru": "BMW X5 xDrive40i 2020",
        "title_en": "BMW X5 xDrive40i 2020",
        "body_type": "suv",
        "color_name": "Чёрный",
        "seats": 5,
        "doors": 5,
        "engine_type": "petrol",
        "engine_volume_l": 3.0,
        "power_hp": 340,
        "transmission": "automatic",
        "drive": "awd",
        "mileage_km": 58000,
        "condition": "very_good",
        "damage": "none",
        "accident_history": False,
        "service_history": "Регулярное ТО, последний сервис при 55000 км",
        "price_eur": 54500,
        "price_is_approximate": True,
        "admin_badge": "recommended",
        "admin_note_ru": "Полноразмерный кроссовер с премиум-комплектацией. Идеально для семьи и командировок.",
        "admin_note_en": "Full-size premium SUV — perfect for family trips and long-distance comfort.",
        "recommended": True,
        "options": ["Подвеска xDrive", "M Sport Package", "Harman/Kardon", "Поясничная поддержка", "Парктроник 360°"],
        "main_image_url": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1617886322168-72b886573c5f?auto=format&fit=crop&w=1400&q=80",
        ],
        "published": True,
        "sort_order": 2,
    },
    {
        "make": "Tesla",
        "model": "Model 3",
        "year": 2022,
        "title_ru": "Tesla Model 3 Long Range 2022",
        "title_en": "Tesla Model 3 Long Range 2022",
        "body_type": "sedan",
        "color_name": "Белый",
        "seats": 5,
        "doors": 4,
        "engine_type": "electric",
        "engine_volume_l": None,
        "power_hp": 351,
        "transmission": "automatic",
        "drive": "awd",
        "mileage_km": 21000,
        "condition": "excellent",
        "damage": "none",
        "accident_history": False,
        "service_history": "Один владелец, гарантия Tesla",
        "price_eur": 31900,
        "price_is_approximate": True,
        "admin_badge": "best_price",
        "admin_note_ru": "Электромобиль с запасом хода 580 км. Заряд через Supercharger 15 минут до 80%.",
        "admin_note_en": "Long-range EV with 580 km range. Supercharger 15-min top-up to 80%.",
        "recommended": True,
        "options": ["Autopilot", "Premium интерьер", "Panoramic roof", "Vegan leather", "Heat pump"],
        "main_image_url": "https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?auto=format&fit=crop&w=1400&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1617704548623-340376564e1f?auto=format&fit=crop&w=1400&q=80",
        ],
        "published": True,
        "sort_order": 3,
    },
    {
        "make": "Volkswagen",
        "model": "Golf",
        "year": 2019,
        "title_ru": "Volkswagen Golf 1.5 TSI 2019",
        "title_en": "Volkswagen Golf 1.5 TSI 2019",
        "body_type": "hatchback",
        "color_name": "Синий",
        "seats": 5,
        "doors": 5,
        "engine_type": "petrol",
        "engine_volume_l": 1.5,
        "power_hp": 150,
        "transmission": "dct",
        "drive": "fwd",
        "mileage_km": 78000,
        "condition": "good",
        "damage": "light",
        "accident_history": False,
        "service_history": "Сервисная книжка, ТО каждые 15000 км",
        "price_eur": 13900,
        "price_is_approximate": True,
        "admin_badge": "low_mileage",
        "admin_note_ru": "Хороший вариант для города с экономным расходом. Лёгкие косметические замечания учтены в цене.",
        "admin_note_en": "Great city commuter with low fuel consumption. Minor cosmetic touches included in price.",
        "recommended": True,
        "options": ["Climatronic", "LED Adaptive", "Apple CarPlay", "Парктроник"],
        "main_image_url": "https://images.unsplash.com/photo-1632245889029-e406faaa34cd?auto=format&fit=crop&w=1400&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1632245889029-e406faaa34cd?auto=format&fit=crop&w=1400&q=80",
        ],
        "published": True,
        "sort_order": 4,
    },
]


def slugify(make, model, year):
    base = f"{make}-{model}-{year}".lower().replace(" ", "-")
    suffix = uuid.uuid4().hex[:6]
    return f"{base}-{suffix}"


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    now = datetime.now(timezone.utc)
    inserted = 0
    for d in DEMOS:
        # idempotent: skip if a published car with same make+model+year already exists
        existing = await db.cars.find_one({
            "make": d["make"], "model": d["model"], "year": d["year"], "published": True,
        })
        if existing:
            print(f"  skip existing: {d['make']} {d['model']} {d['year']}")
            continue
        doc = dict(d)
        doc["id"] = str(uuid.uuid4())
        doc["slug"] = slugify(d["make"], d["model"], d["year"])
        doc["currency"] = "EUR"
        doc["budget_bucket"] = budget_for(d["price_eur"])
        doc["created_at"] = now
        doc["updated_at"] = now
        await db.cars.insert_one(doc)
        inserted += 1
        print(f"  inserted: {doc['slug']} ({d['make']} {d['model']} {d['year']}, {d['price_eur']} €)")
    print(f"\nDONE: {inserted} cars inserted")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
