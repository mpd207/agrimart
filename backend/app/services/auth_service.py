import random
import string
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def register_user(db: AsyncSession, mobile: str, password: str = None, **kwargs) -> User:
    result = await db.execute(select(User).where(User.mobile == mobile))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    user = User(
        mobile=mobile,
        hashed_password=hash_password(password) if password else None,
        **kwargs,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login_with_password(db: AsyncSession, mobile: str, password: str) -> str:
    result = await db.execute(select(User).where(User.mobile == mobile))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password or ""):
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")
    return create_access_token({"sub": str(user.id)}), user


async def request_otp(db: AsyncSession, mobile: str) -> str:
    result = await db.execute(select(User).where(User.mobile == mobile))
    user = result.scalar_one_or_none()
    if not user:
        # Auto-create account for OTP-first flow
        user = User(mobile=mobile)
        db.add(user)
    otp = _generate_otp()
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(seconds=settings.OTP_EXPIRE_SECONDS)
    await db.commit()
    # In production: send via SMS gateway (Twilio / MSG91)
    # For dev: return OTP directly in response
    return otp


async def verify_otp(db: AsyncSession, mobile: str, otp: str):
    result = await db.execute(select(User).where(User.mobile == mobile))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.otp_code != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
    token = create_access_token({"sub": str(user.id)})
    return token, user
