from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.schemas.schemas import MarketPriceResponse
from app.services.market_service import get_all_prices, refresh_market_prices

router = APIRouter(prefix="/api/market-prices", tags=["market-prices"])


@router.get("", response_model=List[MarketPriceResponse])
async def list_market_prices(db: AsyncSession = Depends(get_db)):
    """
    GET /api/market-prices
    Returns current commodity prices. Prices are auto-refreshed every 30s by
    the background scheduler. Response time target: < 1 second.
    """
    return await get_all_prices(db)


@router.post("/refresh", response_model=List[MarketPriceResponse])
async def manual_refresh(db: AsyncSession = Depends(get_db)):
    """Trigger an immediate price refresh (useful for testing)."""
    await refresh_market_prices(db)
    return await get_all_prices(db)
