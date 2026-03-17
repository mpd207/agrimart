from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base


class Seed(Base):
    __tablename__ = "seeds"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    variety      = Column(String, nullable=False)
    price_per_kg = Column(Float, nullable=False)
    unit         = Column(String, default="kg")
    stock        = Column(Float, nullable=False)         # kg in stock
    season       = Column(String, nullable=False)        # Rabi | Kharif | Both
    category     = Column(String, nullable=False)        # Cereal | Vegetable | Oilseed
    emoji        = Column(String, nullable=True)
    germination  = Column(String, nullable=True)
    harvest_days = Column(String, nullable=True)
    description  = Column(String, nullable=True)
