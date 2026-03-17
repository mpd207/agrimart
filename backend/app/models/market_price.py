from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.core.database import Base


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id             = Column(Integer, primary_key=True, index=True)
    commodity      = Column(String, index=True, nullable=False)   # e.g. "wheat"
    name           = Column(String, nullable=False)
    emoji          = Column(String, nullable=True)
    price          = Column(Float, nullable=False)
    base_price     = Column(Float, nullable=False)
    unit           = Column(String, nullable=False)               # e.g. "₹/quintal"
    market         = Column(String, nullable=True)
    change_percent = Column(Float, default=0.0)
    timestamp      = Column(DateTime, server_default=func.now(), onupdate=func.now())
