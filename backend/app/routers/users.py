from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.schemas import UserProfileResponse, UserProfileUpdate
from app.services import auth_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await auth_service.update_profile(
        db,
        current_user,
        full_name=body.full_name,
        pincode=body.pincode,
        farming_type=body.farming_type,
        landsize_acres=body.landsize_acres,
    )
