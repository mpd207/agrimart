from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.schemas import NotificationResponse, PriceAlertCreate, PriceAlertResponse
from app.services.notification_service import (
    create_alert,
    delete_alert,
    list_alerts,
    list_notifications,
    mark_notification_read,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await list_notifications(db, current_user.id)


@router.post("/{notification_id}/read", response_model=NotificationResponse | None)
async def read_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await mark_notification_read(db, current_user.id, notification_id)


@router.get("/alerts", response_model=List[PriceAlertResponse])
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await list_alerts(db, current_user.id)


@router.post("/alerts", response_model=PriceAlertResponse)
async def add_alert(
    body: PriceAlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_alert(db, current_user.id, body.commodity, body.target_price, body.direction)


@router.delete("/alerts/{alert_id}")
async def remove_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_alert(db, current_user.id, alert_id)
    return {"message": "Alert deleted"}
