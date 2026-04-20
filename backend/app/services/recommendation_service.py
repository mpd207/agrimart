from collections import Counter
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.models.user import User
from app.services.fertilizer_service import get_all_fertilizers
from app.services.seed_service import get_all_seeds
from app.services.weather_service import get_weather_context_for_pincode


SEASON_MONTHS = {
    "Rabi": {10, 11, 12, 1, 2, 3},
    "Kharif": {6, 7, 8, 9},
}


def get_current_season(current_date: datetime | None = None) -> str:
    month = (current_date or datetime.utcnow()).month
    if month in SEASON_MONTHS["Rabi"]:
        return "Rabi"
    if month in SEASON_MONTHS["Kharif"]:
        return "Kharif"
    return "Both"


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


def _confidence_score(base_score: float, behavior_hits: int) -> int:
    confidence = 62 + (base_score * 4) + (behavior_hits * 6)
    return max(70, min(98, int(round(confidence))))


async def get_recommendations(db: AsyncSession, user: User):
    season = get_current_season()
    weather = await get_weather_context_for_pincode(db, user.pincode, season)
    behavior_types, behavior_keywords = await _user_behavior(db, user.id)

    seeds = await get_all_seeds(db, season=season)
    fertilizers = await get_all_fertilizers(db)

    def seed_score(item):
        score = 0.0
        if item.season == season:
            score += 4
        elif item.season == "Both":
            score += 2
        if item.stock >= 100:
            score += 2
        if weather["seed_boost"] and item.category == weather["seed_boost"]:
            score += 3
        score += behavior_keywords.get(item.category.lower(), 0) * 1.5
        score += 1 if item.price_per_kg <= 200 else 0
        return score

    def fert_score(item):
        score = 0.0
        if item.stock >= 100:
            score += 2
        if weather["fert_boost"] and item.type == weather["fert_boost"]:
            score += 3
        score += behavior_keywords.get(item.type.lower(), 0) * 1.5
        if behavior_types.get("fertilizer"):
            score += 1
        farming_type = (user.farming_type or "").lower()
        if farming_type == "organic" and item.type == "Nitrogenous":
            score -= 3
        if item.price_per_bag <= 900:
            score += 1
        return score

    prioritized_seeds = sorted(seeds, key=lambda item: (-seed_score(item), item.price_per_kg, item.name.lower()))[:4]
    prioritized_ferts = sorted(fertilizers, key=lambda item: (-fert_score(item), item.price_per_bag, item.name.lower()))[:3]

    recommendations = []
    location_label = weather["location_name"]
    weather_label = weather["weather_label"]
    source_label = "live weather" if weather["source"] == "open-meteo" else "seasonal fallback weather"

    for seed in prioritized_seeds:
        behavior_hits = behavior_keywords.get(seed.category.lower(), 0)
        confidence = _confidence_score(seed_score(seed), behavior_hits)
        if confidence < 85:
            continue
        behavior_note = "based on your recent order patterns" if behavior_hits else "for your current crop cycle"
        recommendations.append({
            "item_type": "seed",
            "item_id": seed.id,
            "title": seed.name,
            "subtitle": f"{seed.variety} • {seed.category}",
            "reason": f"Recommended for {season} in {location_label} using {source_label}: {weather_label}, {behavior_note}.",
            "season_match": seed.season,
            "emoji": seed.emoji,
            "price_label": f"₹{seed.price_per_kg}/{seed.unit}",
        })

    for fert in prioritized_ferts:
        behavior_hits = behavior_keywords.get(fert.type.lower(), 0) + behavior_types.get("fertilizer", 0)
        confidence = _confidence_score(fert_score(fert), behavior_hits)
        if confidence < 85:
            continue
        usage_note = "and aligns with your recent fertilizer purchases" if behavior_hits else "and supports current seasonal soil needs"
        recommendations.append({
            "item_type": "fertilizer",
            "item_id": fert.id,
            "title": fert.name,
            "subtitle": f"{fert.type} • NPK {fert.npk_ratio}",
            "reason": f"Recommended for {location_label} using {source_label}: {weather_label} {usage_note}.",
            "season_match": season,
            "emoji": fert.emoji,
            "price_label": f"₹{fert.price_per_bag}/{fert.unit}",
        })

    if recommendations:
        return recommendations[:5]

    fallback = []
    for seed in prioritized_seeds[:2]:
        fallback.append({
            "item_type": "seed",
            "item_id": seed.id,
            "title": seed.name,
            "subtitle": f"{seed.variety} • {seed.category}",
            "reason": f"Seasonal fallback for {season} in {location_label} based on weather context: {weather_label}.",
            "season_match": seed.season,
            "emoji": seed.emoji,
            "price_label": f"₹{seed.price_per_kg}/{seed.unit}",
        })
    return fallback
