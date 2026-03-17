from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.services.market_service import seed_market_prices, refresh_market_prices
from app.services.seed_service import seed_seeds
from app.services.fertilizer_service import seed_fertilizers
from app.routers import auth, market_prices, seeds, fertilizers, cart

scheduler = AsyncIOScheduler()


async def _scheduled_price_refresh():
    async with AsyncSessionLocal() as db:
        await refresh_market_prices(db)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────
    await init_db()
    async with AsyncSessionLocal() as db:
        await seed_market_prices(db)
        await seed_seeds(db)
        await seed_fertilizers(db)

    # Background price refresh every 30 seconds (User Story 1)
    scheduler.add_job(
        _scheduled_price_refresh,
        "interval",
        seconds=settings.PRICE_REFRESH_INTERVAL_SECONDS,
        id="price_refresh",
    )
    scheduler.start()

    yield

    # ── Shutdown ─────────────────────────────────────────
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="AgriMart API",
    description="Backend for AgriMart – India's Farmer Marketplace",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(market_prices.router)
app.include_router(seeds.router)
app.include_router(fertilizers.router)
app.include_router(cart.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "AgriMart API"}
