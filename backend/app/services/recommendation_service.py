from collections import Counter
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.models.user import User
from app.services.fertilizer_service import get_all_fertilizers
from app.services.seed_service import get_all_seeds


SEASON_MONTHS = {
    "Rabi": {10, 11, 12, 1, 2, 3},
    "Kharif": {6, 7, 8, 9},
}

PINCODE_REGIONS = {
    "60": "Tamil Nadu",
    "61": "Tamil Nadu",
    "62": "Tamil Nadu",
    "63": "Tamil Nadu",
    "64": "Tamil Nadu",
    "11": "Delhi NCR",
    "14": "Punjab",
    "15": "Punjab",
    "27": "Maharashtra",
    "28": "Uttar Pradesh",
}

WEATHER_PROFILES = {
    "Tamil Nadu": {"label": "warm with mixed monsoon conditions", "seed_boost": "Vegetable", "fert_boost": "Complex"},
    "Punjab": {"label": "cool-to-dry crop weather", "seed_boost": "Cereal", "fert_boost": "Nitrogenous"},
    "Maharashtra": {"label": "monsoon-driven field conditions", "seed_boost": "Oilseed", "fert_boost": "Potassic"},
    "Uttar Pradesh": {"label": "north plains seasonal cycle", "seed_boost": "Cereal", "fert_boost": "Phosphatic"},
    "Delhi NCR": {"label": "dry inland conditions", "seed_boost": "Vegetable", "fert_boost": "Complex"},
    "your region": {"label": "your local seasonal conditions", "seed_boost": None, "fert_boost": None},
}


def get_current_season(current_date: datetime | None = None) -> str:
    month = (current_date or datetime.utcnow()).month
    if month in SEASON_MONTHS["Rabi"]:
        return "Rabi"
    if month in SEASON_MONTHS["Kharif"]:
        return "Kharif"
    return "Both"


def infer_region(pincode: str | None) -> str:
    if not pincode:
        return "your region"
    return PINCODE_REGIONS.get(str(pincode)[:2], "your region")


def weather_context(region: str):
    return WEATHER_PROFILES.get(region, WEATHER_PROFILES["your region"])


async def _user_behavior(db: AsyncSession, user_id: int):
    order_ids = (
        await db.execute(select(Order.id).where(Order.user_id == user_id).order_by(Order.created_at.desc()).limit(5))
    ).scalars().all()
    if not order_ids:
        return Counter(), Counter()

    items = (
        await db.execute(select(OrderItem).where(OrderItem.order_id.in_(order_ids)))
    ).scalars().all()

    type_counter = Counter(item.item_type for item in items)
    keyword_counter = Counter()
    for item in items:
        name = item.item_name.lower()
        if "wheat" in name or "maize" in name:
            keyword_counter["cereal"] += 1
        if "tomato" in name or "onion" in name or "potato" in name:
            keyword_counter["vegetable"] += 1
        if "sunflower" in name:
            keyword_counter["oilseed"] += 1
        if "urea" in name or "ammonia" in name:
            keyword_counter["nitrogenous"] += 1
        if "dap" in name or "ssp" in name:
            keyword_counter["phosphatic"] += 1
        if "potash" in name or "mop" in name:
            keyword_counter["potassic"] += 1
        if "npk" in name:
            keyword_counter["complex"] += 1

    return type_counter, keyword_counter


async def get_recommendations(db: AsyncSession, user: User):
    season = get_current_season()
    region = infer_region(user.pincode)
    weather = weather_context(region)
    behavior_types, behavior_keywords = await _user_behavior(db, user.id)

    seeds = await get_all_seeds(db, season=season)
    fertilizers = await get_all_fertilizers(db)

    def seed_score(item):
        score = 0
        if item.season == season:
            score += 4
        elif item.season == "Both":
            score += 2
        if item.stock >= 100:
            score += 2
        if weather["seed_boost"] and item.category == weather["seed_boost"]:
            score += 2
        score += behavior_keywords.get(item.category.lower(), 0) * 1.5
        score += 1 if item.price_per_kg <= 200 else 0
        return score

    def fert_score(item):
        score = 0
        if item.stock >= 100:
            score += 2
        if weather["fert_boost"] and item.type == weather["fert_boost"]:
            score += 2
        score += behavior_keywords.get(item.type.lower(), 0) * 1.5
        if behavior_types.get("fertilizer"):
            score += 1
        farming_type = (user.farming_type or "").lower()
        if farming_type == "organic" and item.type == "Nitrogenous":
            score -= 3
        if item.price_per_bag <= 900:
            score += 1
        return score

    prioritized_seeds = sorted(seeds, key=lambda item: (-seed_score(item), item.price_per_kg, item.name.lower()))[:3]
    prioritized_ferts = sorted(fertilizers, key=lambda item: (-fert_score(item), item.price_per_bag, item.name.lower()))[:2]

    recommendations = []

    for seed in prioritized_seeds:
        behavior_note = "based on your recent browsing and order patterns" if behavior_keywords.get(seed.category.lower()) else "for your current crop cycle"
        recommendations.append({
            "item_type": "seed",
            "item_id": seed.id,
            "title": seed.name,
            "subtitle": f"{seed.variety} • {seed.category}",
            "reason": f"Good fit for the {season} season in {region} with {weather['label']}, {behavior_note}.",
            "season_match": seed.season,
            "emoji": seed.emoji,
            "price_label": f"₹{seed.price_per_kg}/{seed.unit}",
        })

    for fert in prioritized_ferts:
        usage_note = "and aligns with your recent order behavior" if behavior_keywords.get(fert.type.lower()) or behavior_types.get("fertilizer") else "and supports current seasonal soil needs"
        recommendations.append({
            "item_type": "fertilizer",
            "item_id": fert.id,
            "title": fert.name,
            "subtitle": f"{fert.type} • NPK {fert.npk_ratio}",
            "reason": f"Suited to {weather['label']} in {region} {usage_note}.",
            "season_match": season,
            "emoji": fert.emoji,
            "price_label": f"₹{fert.price_per_bag}/{fert.unit}",
        })

    return recommendations[:5]
