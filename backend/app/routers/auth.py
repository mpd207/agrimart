from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.schemas import (
    LoginRequest,
    OTPRequest,
    OTPRequestResponse,
    OTPVerifyRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token_response(token: str, user: User) -> TokenResponse:
    return TokenResponse(access_token=token, user=user)


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
    return _token_response(token, user)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    token, user = await auth_service.login_with_password(db, body.mobile, body.password)
    return _token_response(token, user)


@router.post("/otp/request", response_model=OTPRequestResponse)
async def request_otp(body: OTPRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.request_otp(db, body.mobile)


@router.post("/send-otp", response_model=OTPRequestResponse)
async def send_otp(body: OTPRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.request_otp(db, body.mobile)


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(body: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    token, user = await auth_service.verify_otp(db, body.mobile, body.otp)
    return _token_response(token, user)


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_alias(body: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    token, user = await auth_service.verify_otp(db, body.mobile, body.otp)
    return _token_response(token, user)


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await auth_service.update_profile(
        db,
        current_user,
        full_name=body.full_name,
        pincode=body.pincode,
        farming_type=body.farming_type,
        landsize_acres=body.landsize_acres,
    )
