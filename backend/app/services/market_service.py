import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.market_price import MarketPrice
from app.models.market_price_history import MarketPriceHistory
from app.models.notification import PriceAlert
from app.services.notification_service import create_notification

SEED_COMMODITIES = [
    dict(commodity="wheat",  name="Wheat",        emoji="🌾", base_price=2150, unit="₹/quintal", market="APMC Punjab"),
    dict(commodity="rice",   name="Rice (Paddy)",  emoji="🌾", base_price=2200, unit="₹/quintal", market="UP Mandi"),
    dict(commodity="cotton", name="Cotton",        emoji="🌿", base_price=5850, unit="₹/quintal", market="Vidarbha Mandi"),
    dict(commodity="maize",  name="Maize",         emoji="🌽", base_price=1780, unit="₹/quintal", market="Rajasthan APMC"),
    dict(commodity="soy",    name="Soybean",       emoji="🫘", base_price=4320, unit="₹/quintal", market="MP Mandi"),
    dict(commodity="onion",  name="Onion",         emoji="🧅", base_price=1240, unit="₹/quintal", market="Nashik Mandi"),
]


async def seed_market_prices(db: AsyncSession):
    """Insert initial market price rows if table is empty."""
    result = await db.execute(select(MarketPrice))
    if result.scalars().first():
        return
    for c in SEED_COMMODITIES:
        db.add(MarketPrice(
            commodity=c["commodity"],
            name=c["name"],
            emoji=c["emoji"],
            price=c["base_price"],
            base_price=c["base_price"],
            unit=c["unit"],
            market=c["market"],
            change_percent=0.0,
        ))
    await db.commit()
    await seed_market_history(db)


async def seed_market_history(db: AsyncSession):
    result = await db.execute(select(MarketPriceHistory.id).limit(1))
    if result.scalar_one_or_none():
        return

    rows = (await db.execute(select(MarketPrice))).scalars().all()
    today = datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0)
    for row in rows:
        for offset in range(90, 0, -1):
            point_time = today - timedelta(days=offset)
            price = max(100, round(row.base_price + _point_adjustment(row.commodity, 90 - offset), 2))
            db.add(MarketPriceHistory(
                commodity=row.commodity,
                name=row.name,
                emoji=row.emoji,
                price=price,
                unit=row.unit,
                market=row.market,
                change_percent=0.0,
                recorded_at=point_time,
            ))
    await db.commit()


async def refresh_market_prices(db: AsyncSession):
    """Simulate ±₹50 variation on base prices. Called by scheduler every 30s."""
    result = await db.execute(select(MarketPrice))
    rows = result.scalars().all()
    for row in rows:
        variation = random.uniform(-50, 50)
        new_price = round(row.base_price + variation, 2)
        change_pct = round((new_price - row.price) / row.price * 100, 2)
        row.price = new_price
        row.change_percent = change_pct
        row.timestamp = datetime.utcnow()
        db.add(MarketPriceHistory(
            commodity=row.commodity,
            name=row.name,
            emoji=row.emoji,
            price=new_price,
            unit=row.unit,
            market=row.market,
            change_percent=change_pct,
            recorded_at=row.timestamp,
        ))
        alerts = (
            await db.execute(
                select(PriceAlert).where(
                    PriceAlert.commodity == row.commodity,
                    PriceAlert.is_enabled == True,  # noqa: E712
                )
            )
        ).scalars().all()
        for alert in alerts:
            crossed_above = alert.direction == "above" and new_price >= alert.target_price
            crossed_below = alert.direction == "below" and new_price <= alert.target_price
            if crossed_above or crossed_below:
                if alert.last_triggered_price != new_price:
                    await create_notification(
                        db,
                        alert.user_id,
                        "price_alert",
                        f"{row.name} alert triggered",
                        f"{row.name} is now ₹{new_price} ({row.unit}), which is {alert.direction} your alert price of ₹{alert.target_price}.",
                    )
                    alert.last_triggered_price = new_price
    await db.commit()


async def get_all_prices(db: AsyncSession):
    result = await db.execute(select(MarketPrice))
    return result.scalars().all()


def _point_adjustment(commodity: str, day_index: int) -> float:
    seed = sum(ord(ch) for ch in commodity)
    wave = ((day_index * ((seed % 7) + 3)) % 17) - 8
    slope = ((seed % 5) - 2) * day_index * 0.35
    return round((wave * 4.7) + slope, 2)


async def get_price_trends(db: AsyncSession, period_days: int):
    rows = (await db.execute(select(MarketPrice))).scalars().all()
    since = datetime.utcnow() - timedelta(days=period_days)
    trends = []

    for row in rows:
        history_rows = (
            await db.execute(
                select(MarketPriceHistory)
                .where(
                    MarketPriceHistory.commodity == row.commodity,
                    MarketPriceHistory.recorded_at >= since,
                )
                .order_by(MarketPriceHistory.recorded_at.asc())
            )
        ).scalars().all()

        if not history_rows:
            history_rows = [
                MarketPriceHistory(
                    commodity=row.commodity,
                    name=row.name,
                    emoji=row.emoji,
                    price=row.price,
                    unit=row.unit,
                    market=row.market,
                    change_percent=row.change_percent,
                    recorded_at=row.timestamp,
                )
            ]

        grouped = {}
        for entry in history_rows:
            grouped[entry.recorded_at.date().isoformat()] = entry.price

        points = [{"date": date_key, "price": price} for date_key, price in sorted(grouped.items())]

        trends.append({
            "commodity": row.commodity,
            "name": row.name,
            "emoji": row.emoji,
            "unit": row.unit,
            "period_days": period_days,
            "current_price": row.price,
            "low_price": min(point["price"] for point in points),
            "high_price": max(point["price"] for point in points),
            "points": points,
        })

    return trends
