from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    full_name     = Column(String, nullable=True)
    mobile        = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    pincode       = Column(String, nullable=True)
    farming_type  = Column(String, nullable=True)
    landsize_acres = Column(String, nullable=True)
    otp_code      = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, server_default=func.now())
