from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.core.database import Base


class MarketPriceHistory(Base):
    __tablename__ = "market_price_history"

    id = Column(Integer, primary_key=True, index=True)
    commodity = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    emoji = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    market = Column(String, nullable=True)
    change_percent = Column(Float, default=0.0)
    recorded_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
