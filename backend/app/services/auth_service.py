import random
import string
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.services.otp_store import clear_otp, read_otp, save_otp
from app.services.sms_service import send_sms


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


async def ensure_admin_user(db: AsyncSession) -> User | None:
    if not settings.ADMIN_MOBILE:
        return None

    result = await db.execute(select(User).where(User.mobile == settings.ADMIN_MOBILE))
    user = result.scalar_one_or_none()
    hashed_password = hash_password(settings.ADMIN_PASSWORD) if settings.ADMIN_PASSWORD else None

    if user:
        user.role = "admin"
        if settings.ADMIN_NAME and not user.full_name:
            user.full_name = settings.ADMIN_NAME
        if hashed_password:
            user.hashed_password = hashed_password
    else:
        user = User(
            mobile=settings.ADMIN_MOBILE,
            full_name=settings.ADMIN_NAME,
            hashed_password=hashed_password,
            role="admin",
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
    user.last_login = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    return create_access_token({"sub": str(user.id)}), user


async def request_otp(db: AsyncSession, mobile: str):
    result = await db.execute(select(User).where(User.mobile == mobile))
    user = result.scalar_one_or_none()
    if not user:
        # Auto-create account for OTP-first flow
        user = User(mobile=mobile)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    otp = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(seconds=settings.OTP_EXPIRE_SECONDS)
    await save_otp(db, user, otp, expires_at)
    delivery_mode = await send_sms(mobile, f"Your AgriMart OTP is {otp}. It expires in {settings.OTP_EXPIRE_SECONDS // 60} minutes.")
    return {
        "message": "OTP sent",
        "delivery_mode": delivery_mode,
        "dev_otp": otp if settings.DEBUG_OTP or delivery_mode == "dev" else None,
    }


async def verify_otp(db: AsyncSession, mobile: str, otp: str):
    result = await db.execute(select(User).where(User.mobile == mobile))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    stored_otp, expires_at = await read_otp(db, user)
    if stored_otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if not expires_at or datetime.utcnow() > expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")
    await clear_otp(db, user)
    user.last_login = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return token, user


async def update_profile(db: AsyncSession, user: User, **kwargs) -> User:
    for field, value in kwargs.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user
