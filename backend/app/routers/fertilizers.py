from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.core.database import get_db
from app.schemas.schemas import FertilizerResponse
from app.services.fertilizer_service import get_all_fertilizers, get_fertilizer_by_id

router = APIRouter(prefix="/api/fertilizers", tags=["fertilizers"])


@router.get("", response_model=List[FertilizerResponse])
async def list_fertilizers(
    type: Optional[str]   = Query(None, description="Nitrogenous | Phosphatic | Potassic | Complex"),
    search: Optional[str] = Query(None, description="Partial match on name, type, or NPK ratio"),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/fertilizers
    Returns fertilizer catalog with NPK ratios. Supports type filter and search.
    """
    return await get_all_fertilizers(db, ftype=type, search=search)


@router.get("/{fert_id}", response_model=FertilizerResponse)
async def get_fertilizer(fert_id: int, db: AsyncSession = Depends(get_db)):
    fert = await get_fertilizer_by_id(db, fert_id)
    if not fert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Fertilizer not found")
    return fert
