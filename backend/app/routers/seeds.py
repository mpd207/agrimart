from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.database import get_db
from app.schemas.schemas import SeedResponse
from app.services.seed_service import get_all_seeds, get_seed_by_id

router = APIRouter(prefix="/api/seeds", tags=["seeds"])


@router.get("", response_model=List[SeedResponse])
async def list_seeds(
    season: Optional[str]   = Query(None, description="Rabi | Kharif | Both"),
    category: Optional[str] = Query(None, description="Cereal | Vegetable | Oilseed"),
    search: Optional[str]   = Query(None, description="Partial match on name or variety"),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/seeds
    Returns seed catalog. Supports optional filtering by season, category, and
    partial-text search. Page load target: < 2 seconds.
    """
    return await get_all_seeds(db, season=season, category=category, search=search)


@router.get("/{seed_id}", response_model=SeedResponse)
async def get_seed(seed_id: int, db: AsyncSession = Depends(get_db)):
    seed = await get_seed_by_id(db, seed_id)
    if not seed:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Seed not found")
    return seed
