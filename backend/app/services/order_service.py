from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.services.notification_service import create_notification

ORDER_STATUSES = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"]
USER_CANCELLABLE = {"Placed", "Processing"}


def _serialize_order(order: Order, items: list[OrderItem]):
    return {
        "id": order.id,
        "status": order.status,
        "subtotal": order.subtotal,
        "delivery": order.delivery,
        "discount": order.discount,
        "total": order.total,
        "item_count": order.item_count,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "item_type": item.item_type,
                "item_id": item.item_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "item_name": item.item_name,
                "item_emoji": item.item_emoji,
                "subtotal": item.subtotal,
            }
            for item in items
        ],
    }


async def _load_order_with_items(db: AsyncSession, order_id: int, user_id: int | None = None):
    query = select(Order).where(Order.id == order_id)
    if user_id is not None:
        query = query.where(Order.user_id == user_id)
    order = (await db.execute(query)).scalar_one_or_none()
    if not order:
        return None, []
    items = (
        await db.execute(select(OrderItem).where(OrderItem.order_id == order.id).order_by(OrderItem.id.asc()))
    ).scalars().all()
    return order, items


async def place_order_from_cart(db: AsyncSession, user_id: int):
    cart_items = (
        await db.execute(select(CartItem).where(CartItem.user_id == user_id))
    ).scalars().all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    subtotal = round(sum(item.unit_price * item.quantity for item in cart_items), 2)
    delivery = 50.0
    discount = round(subtotal * 0.05, 2)
    total = round(subtotal + delivery - discount, 2)

    order = Order(
        user_id=user_id,
        status="Placed",
        subtotal=subtotal,
        delivery=delivery,
        discount=discount,
        total=total,
        item_count=len(cart_items),
    )
    db.add(order)
    await db.flush()

    created_items = []
    for cart_item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            item_type=cart_item.item_type,
            item_id=cart_item.item_id,
            quantity=cart_item.quantity,
            unit_price=cart_item.unit_price,
            item_name=cart_item.item_name,
            item_emoji=cart_item.item_emoji,
            subtotal=round(cart_item.unit_price * cart_item.quantity, 2),
        )
        db.add(order_item)
        created_items.append(order_item)

    await db.execute(delete(CartItem).where(CartItem.user_id == user_id))
    await db.commit()

    await db.refresh(order)
    for item in created_items:
        await db.refresh(item)

    await create_notification(
        db,
        user_id,
        "order",
        f"Order #{order.id} placed",
        f"Your order total is ₹{order.total}. We will notify you as it moves through processing.",
    )
    return _serialize_order(order, created_items)


async def get_orders(db: AsyncSession, user_id: int):
    orders = (
        await db.execute(select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc(), Order.id.desc()))
    ).scalars().all()

    serialized = []
    for order in orders:
        items = (
            await db.execute(select(OrderItem).where(OrderItem.order_id == order.id).order_by(OrderItem.id.asc()))
        ).scalars().all()
        serialized.append(_serialize_order(order, items))
    return serialized


async def get_all_orders(db: AsyncSession):
    orders = (
        await db.execute(select(Order).order_by(Order.created_at.desc(), Order.id.desc()))
    ).scalars().all()

    serialized = []
    for order in orders:
        items = (
            await db.execute(select(OrderItem).where(OrderItem.order_id == order.id).order_by(OrderItem.id.asc()))
        ).scalars().all()
        payload = _serialize_order(order, items)
        payload["user_id"] = order.user_id
        serialized.append(payload)
    return serialized


async def cancel_order(db: AsyncSession, user_id: int, order_id: int):
    order, items = await _load_order_with_items(db, order_id, user_id=user_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in USER_CANCELLABLE:
        raise HTTPException(status_code=400, detail="This order can no longer be cancelled")
    order.status = "Cancelled"
    await db.commit()
    await db.refresh(order)
    await create_notification(db, user_id, "order", f"Order #{order.id} cancelled", "Your order has been cancelled successfully.")
    return _serialize_order(order, items)


async def reorder_order(db: AsyncSession, user_id: int, order_id: int):
    order, items = await _load_order_with_items(db, order_id, user_id=user_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    for item in items:
        db.add(CartItem(
            user_id=user_id,
            item_type=item.item_type,
            item_id=item.item_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            item_name=item.item_name,
            item_emoji=item.item_emoji,
        ))
    await db.commit()
    await create_notification(db, user_id, "order", f"Order #{order.id} reordered", "Items from your previous order were added back to the cart.")
    return {"message": "Items added to cart"}


async def update_order_status(db: AsyncSession, order_id: int, status: str):
    if status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid order status")
    order, items = await _load_order_with_items(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    await db.commit()
    await db.refresh(order)
    await create_notification(
        db,
        order.user_id,
        "order",
        f"Order #{order.id} is now {status}",
        f"Your order status has been updated to {status}.",
    )
    return _serialize_order(order, items)
