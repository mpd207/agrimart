from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, DateTime, func
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    commodity = Column(String, nullable=False, index=True)
    target_price = Column(Float, nullable=False)
    direction = Column(String, nullable=False)  # above | below
    is_enabled = Column(Boolean, default=True, nullable=False)
    last_triggered_price = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
