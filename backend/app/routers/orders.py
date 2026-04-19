from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin_access, require_admin_user
from app.models.user import User
from app.schemas.schemas import AdminOrderResponse, OrderResponse, OrderStatusUpdate
from app.services.order_service import cancel_order, get_all_orders, get_orders, place_order_from_cart, reorder_order, update_order_status

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_orders(db, current_user.id)


@router.get("/admin/all", response_model=List[AdminOrderResponse])
async def list_all_orders_for_admin(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    return await get_all_orders(db)


@router.post("", response_model=OrderResponse)
async def place_order(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await place_order_from_cart(db, current_user.id)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_existing_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await cancel_order(db, current_user.id, order_id)


@router.post("/{order_id}/reorder")
async def reorder_existing_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await reorder_order(db, current_user.id, order_id)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def admin_update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_admin_access),
):
    return await update_order_status(db, order_id, body.status)
