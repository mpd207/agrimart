from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base


class Fertilizer(Base):
    __tablename__ = "fertilizers"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    type          = Column(String, nullable=False)       # Nitrogenous | Phosphatic | Potassic | Complex
    price_per_bag = Column(Float, nullable=False)
    unit          = Column(String, default="50kg bag")
    stock         = Column(Integer, nullable=False)      # bags in stock
    npk_ratio     = Column(String, nullable=False)       # e.g. "46-0-0"
    emoji         = Column(String, nullable=True)
    description   = Column(String, nullable=True)
