from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.fertilizer import Fertilizer

INITIAL_FERTS = [
    dict(name="Urea (Granular)",              type="Nitrogenous", price_per_bag=267,  unit="50kg bag", stock=580,
         npk_ratio="46-0-0",   emoji="🟡",
         description="Most widely used nitrogen fertilizer. Apply before sowing or as top dressing."),
    dict(name="DAP (Di-Ammonium Phosphate)",  type="Phosphatic",  price_per_bag=1350, unit="50kg bag", stock=320,
         npk_ratio="18-46-0",  emoji="⚫",
         description="Most popular phosphatic fertilizer. Recommended as basal dose before sowing."),
    dict(name="MOP (Muriate of Potash)",      type="Potassic",    price_per_bag=850,  unit="50kg bag", stock=190,
         npk_ratio="0-0-60",   emoji="🔴",
         description="Primary potash source. Improves crop quality, disease resistance, and drought tolerance."),
    dict(name="NPK Complex (10:26:26)",       type="Complex",     price_per_bag=1200, unit="50kg bag", stock=450,
         npk_ratio="10-26-26", emoji="🟢",
         description="Balanced NPK complex for high-value crops. Ideal for vegetables, cotton, sugarcane."),
    dict(name="Sulphate of Ammonia",          type="Nitrogenous", price_per_bag=420,  unit="50kg bag", stock=65,
         npk_ratio="21-0-0",   emoji="⚪",
         description="Supplies nitrogen and sulphur. Suitable for sulphur-deficient and alkaline soils."),
    dict(name="SSP (Single Super Phosphate)", type="Phosphatic",  price_per_bag=380,  unit="50kg bag", stock=730,
         npk_ratio="0-16-0",   emoji="🟤",
         description="Provides phosphorus and sulphur. Cheaper alternative to DAP for sulphur-deficient soils."),
]


async def seed_fertilizers(db: AsyncSession):
    result = await db.execute(select(Fertilizer))
    if result.scalars().first():
        return
    for f in INITIAL_FERTS:
        db.add(Fertilizer(**f))
    await db.commit()


async def get_all_fertilizers(db: AsyncSession, ftype: str = None, search: str = None):
    rows = (await db.execute(select(Fertilizer))).scalars().all()
    if ftype and ftype.lower() != "all":
        rows = [r for r in rows if r.type.lower() == ftype.lower()]
    if search:
        s = search.lower()
        rows = [r for r in rows if s in r.name.lower() or s in r.type.lower() or s in r.npk_ratio.lower()]
    return rows


async def get_fertilizer_by_id(db: AsyncSession, fert_id: int):
    result = await db.execute(select(Fertilizer).where(Fertilizer.id == fert_id))
    return result.scalar_one_or_none()
