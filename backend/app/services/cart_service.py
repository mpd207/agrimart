from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import HTTPException
from app.models.cart import CartItem
from app.models.seed import Seed
from app.models.fertilizer import Fertilizer


async def get_cart(db: AsyncSession, user_id: int):
    result = await db.execute(select(CartItem).where(CartItem.user_id == user_id))
    items = result.scalars().all()
    subtotal = sum(i.unit_price * i.quantity for i in items)
    delivery = 50.0
    discount = round(subtotal * 0.05, 2)
    total = round(subtotal + delivery - discount, 2)
    return {
        "items": [
            {**i.__dict__, "subtotal": round(i.unit_price * i.quantity, 2)}
            for i in items
        ],
        "subtotal": round(subtotal, 2),
        "delivery": delivery,
        "discount": discount,
        "total": total,
    }


async def add_to_cart(db: AsyncSession, user_id: int, item_type: str, item_id: int, quantity: float):
    # Resolve price + name from DB
    if item_type == "seed":
        r = await db.execute(select(Seed).where(Seed.id == item_id))
        item = r.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Seed not found")
        price = item.price_per_kg
        name  = f"{item.name} – {item.variety}"
        emoji = item.emoji
    elif item_type == "fertilizer":
        r = await db.execute(select(Fertilizer).where(Fertilizer.id == item_id))
        item = r.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Fertilizer not found")
        price = item.price_per_bag
        name  = item.name
        emoji = item.emoji
    else:
        raise HTTPException(status_code=400, detail="item_type must be 'seed' or 'fertilizer'")

    # Upsert: increment if exists
    existing = await db.execute(
        select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.item_type == item_type,
            CartItem.item_id == item_id,
        )
    )
    cart_row = existing.scalar_one_or_none()
    if cart_row:
        cart_row.quantity += quantity
    else:
        cart_row = CartItem(
            user_id=user_id,
            item_type=item_type,
            item_id=item_id,
            quantity=quantity,
            unit_price=price,
            item_name=name,
            item_emoji=emoji,
        )
        db.add(cart_row)
    await db.commit()
    await db.refresh(cart_row)
    return cart_row


async def update_cart_item(db: AsyncSession, user_id: int, cart_item_id: int, quantity: float):
    r = await db.execute(
        select(CartItem).where(CartItem.id == cart_item_id, CartItem.user_id == user_id)
    )
    row = r.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if quantity <= 0:
        await db.delete(row)
    else:
        row.quantity = quantity
    await db.commit()


async def clear_cart(db: AsyncSession, user_id: int):
    await db.execute(delete(CartItem).where(CartItem.user_id == user_id))
    await db.commit()
