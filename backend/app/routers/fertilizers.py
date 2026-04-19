from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.database import get_db
from app.schemas.schemas import FertilizerResponse
from app.services.fertilizer_service import get_filtered_fertilizers, get_fertilizer_by_id

router = APIRouter(prefix="/api/fertilizers", tags=["fertilizers"])


@router.get("", response_model=List[FertilizerResponse])
async def list_fertilizers(
    type: Optional[str]   = Query(None, description="Nitrogenous | Phosphatic | Potassic | Complex"),
    search: Optional[str] = Query(None, description="Partial match on name, type, or NPK ratio"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort_by: Optional[str] = Query(None, description="price_asc | price_desc | stock_asc | stock_desc"),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/fertilizers
    Returns fertilizer catalog with NPK ratios. Supports type filter and search.
    """
    return await get_filtered_fertilizers(
        db,
        ftype=type,
        search=search,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
    )


@router.get("/{fert_id}", response_model=FertilizerResponse)
async def get_fertilizer(fert_id: int, db: AsyncSession = Depends(get_db)):
    fert = await get_fertilizer_by_id(db, fert_id)
    if not fert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Fertilizer not found")
    return fert
