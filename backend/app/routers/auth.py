from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, OTPRequest,
    OTPVerifyRequest, TokenResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register_user(
        db,
        mobile=body.mobile,
        password=body.password,
        full_name=body.full_name,
        pincode=body.pincode,
        farming_type=body.farming_type,
        landsize_acres=body.landsize_acres,
    )
    from app.core.security import create_access_token
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id, full_name=user.full_name, mobile=user.mobile)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    token, user = await auth_service.login_with_password(db, body.mobile, body.password)
    return TokenResponse(access_token=token, user_id=user.id, full_name=user.full_name, mobile=user.mobile)


@router.post("/otp/request")
async def request_otp(body: OTPRequest, db: AsyncSession = Depends(get_db)):
    otp = await auth_service.request_otp(db, body.mobile)
    # In production remove otp from response — send via SMS
    return {"message": "OTP sent", "dev_otp": otp}


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(body: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    token, user = await auth_service.verify_otp(db, body.mobile, body.otp)
    return TokenResponse(access_token=token, user_id=user.id, full_name=user.full_name, mobile=user.mobile)
