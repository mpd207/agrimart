from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.schemas import CartItemAdd, CartSummaryResponse
from app.services.cart_service import get_cart, add_to_cart, update_cart_item, clear_cart

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.get("", response_model=CartSummaryResponse)
async def view_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_cart(db, current_user.id)


@router.post("", response_model=CartSummaryResponse)
async def add_item(
    body: CartItemAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await add_to_cart(db, current_user.id, body.item_type, body.item_id, body.quantity)
    return await get_cart(db, current_user.id)


@router.patch("/{cart_item_id}")
async def update_item(
    cart_item_id: int,
    quantity: float,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await update_cart_item(db, current_user.id, cart_item_id, quantity)
    return await get_cart(db, current_user.id)


@router.delete("")
async def clear(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await clear_cart(db, current_user.id)
    return {"message": "Cart cleared"}
