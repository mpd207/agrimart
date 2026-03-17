from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.core.database import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_type   = Column(String, nullable=False)    # "seed" | "fertilizer"
    item_id     = Column(Integer, nullable=False)
    quantity    = Column(Float, nullable=False, default=1)
    unit_price  = Column(Float, nullable=False)
    item_name   = Column(String, nullable=False)
    item_emoji  = Column(String, nullable=True)
