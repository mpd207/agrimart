import random
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.market_price import MarketPrice

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
    await db.commit()


async def get_all_prices(db: AsyncSession):
    result = await db.execute(select(MarketPrice))
    return result.scalars().all()
