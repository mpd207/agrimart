from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, PriceAlert


async def create_notification(db: AsyncSession, user_id: int, ntype: str, title: str, message: str):
    notification = Notification(user_id=user_id, type=ntype, title=title, message=message)
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


async def list_notifications(db: AsyncSession, user_id: int):
    return (
        await db.execute(
            select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc(), Notification.id.desc())
        )
    ).scalars().all()


async def mark_notification_read(db: AsyncSession, user_id: int, notification_id: int):
    notification = (
        await db.execute(
            select(Notification).where(Notification.user_id == user_id, Notification.id == notification_id)
        )
    ).scalar_one_or_none()
    if notification:
        notification.is_read = True
        await db.commit()
        await db.refresh(notification)
    return notification


async def list_alerts(db: AsyncSession, user_id: int):
    return (
        await db.execute(select(PriceAlert).where(PriceAlert.user_id == user_id).order_by(PriceAlert.created_at.desc()))
    ).scalars().all()


async def create_alert(db: AsyncSession, user_id: int, commodity: str, target_price: float, direction: str):
    alert = PriceAlert(
        user_id=user_id,
        commodity=commodity.lower(),
        target_price=target_price,
        direction=direction.lower(),
        is_enabled=True,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def delete_alert(db: AsyncSession, user_id: int, alert_id: int):
    alert = (
        await db.execute(select(PriceAlert).where(PriceAlert.user_id == user_id, PriceAlert.id == alert_id))
    ).scalar_one_or_none()
    if alert:
        await db.delete(alert)
        await db.commit()
    return alert
