from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.seed import Seed

INITIAL_SEEDS = [
    dict(name="Tomatoes",  variety="Hybrid 1121",      price_per_kg=320, unit="100g", stock=450, season="Kharif",
         category="Vegetable", emoji="🍅", germination="92%", harvest_days="75-80 days",
         description="High-yield hybrid with superior disease resistance. Produces large, firm tomatoes with excellent shelf life."),
    dict(name="Potatoes",  variety="Kufri Jyoti",      price_per_kg=85,  unit="kg",   stock=820, season="Rabi",
         category="Vegetable", emoji="🥔", germination="95%", harvest_days="80-90 days",
         description="Top-performing Rabi variety with high starch content. Resistant to late blight. Ideal for Punjab, UP, Bihar."),
    dict(name="Lettuce",   variety="Iceberg Premium",  price_per_kg=210, unit="50g",  stock=180, season="Rabi",
         category="Vegetable", emoji="🥬", germination="88%", harvest_days="60-70 days",
         description="Crisp heading variety for cool-season growing. Produces large, dense heads. Best Oct–March."),
    dict(name="Carrots",   variety="Nantes Premium",   price_per_kg=150, unit="50g",  stock=640, season="Both",
         category="Vegetable", emoji="🥕", germination="90%", harvest_days="70-80 days",
         description="Cylindrical, sweet variety with minimal core. Excellent for juice and fresh market."),
    dict(name="Wheat",     variety="HD-2967",          price_per_kg=65,  unit="kg",   stock=80,  season="Rabi",
         category="Cereal",    emoji="🌾", germination="94%", harvest_days="120-130 days",
         description="High-yielding, rust-resistant wheat. Recommended for NW India plains. Excellent chapati quality."),
    dict(name="Maize",     variety="DHM-117",          price_per_kg=55,  unit="kg",   stock=520, season="Kharif",
         category="Cereal",    emoji="🌽", germination="91%", harvest_days="90-100 days",
         description="Disease-tolerant hybrid with high grain yield. Suited for moderate rainfall zones."),
    dict(name="Sunflower", variety="KBSH-44",          price_per_kg=180, unit="kg",   stock=290, season="Kharif",
         category="Oilseed",   emoji="🌻", germination="87%", harvest_days="95-105 days",
         description="High oil content hybrid. Good drought tolerance. Best for black cotton soils."),
    dict(name="Onion",     variety="Nashik Red",       price_per_kg=95,  unit="50g",  stock=410, season="Rabi",
         category="Vegetable", emoji="🧅", germination="85%", harvest_days="100-110 days",
         description="Classic Nashik variety with deep red colour. Excellent storage life of 4-5 months."),
]


async def seed_seeds(db: AsyncSession):
    result = await db.execute(select(Seed))
    if result.scalars().first():
        return
    for s in INITIAL_SEEDS:
        db.add(Seed(**s))
    await db.commit()


async def get_all_seeds(db: AsyncSession, season: str = None, category: str = None, search: str = None):
    q = select(Seed)
    rows = (await db.execute(q)).scalars().all()
    if season and season.lower() != "all":
        rows = [r for r in rows if r.season.lower() == season.lower() or r.season.lower() == "both"]
    if category and category.lower() != "all":
        rows = [r for r in rows if r.category.lower() == category.lower()]
    if search:
        s = search.lower()
        rows = [r for r in rows if s in r.name.lower() or s in r.variety.lower() or s in r.season.lower()]
    return rows


async def get_seed_by_id(db: AsyncSession, seed_id: int):
    result = await db.execute(select(Seed).where(Seed.id == seed_id))
    return result.scalar_one_or_none()
