from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    mobile: str
    password: Optional[str] = None
    full_name: Optional[str] = None
    pincode: Optional[str] = None
    farming_type: Optional[str] = None
    landsize_acres: Optional[str] = None


class LoginRequest(BaseModel):
    mobile: str
    password: str


class OTPRequest(BaseModel):
    mobile: str


class OTPVerifyRequest(BaseModel):
    mobile: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: Optional[str]
    mobile: str


# ── MarketPrice ───────────────────────────────────────
class MarketPriceResponse(BaseModel):
    id: int
    commodity: str
    name: str
    emoji: Optional[str]
    price: float
    unit: str
    market: Optional[str]
    change_percent: float
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Seed ──────────────────────────────────────────────
class SeedResponse(BaseModel):
    id: int
    name: str
    variety: str
    price_per_kg: float
    unit: str
    stock: float
    season: str
    category: str
    emoji: Optional[str]
    germination: Optional[str]
    harvest_days: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True


# ── Fertilizer ────────────────────────────────────────
class FertilizerResponse(BaseModel):
    id: int
    name: str
    type: str
    price_per_bag: float
    unit: str
    stock: int
    npk_ratio: str
    emoji: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True


# ── Cart ──────────────────────────────────────────────
class CartItemAdd(BaseModel):
    item_type: str   # "seed" | "fertilizer"
    item_id: int
    quantity: float


class CartItemResponse(BaseModel):
    id: int
    item_type: str
    item_id: int
    quantity: float
    unit_price: float
    item_name: str
    item_emoji: Optional[str]
    subtotal: float = 0.0

    class Config:
        from_attributes = True


class CartSummaryResponse(BaseModel):
    items: List[CartItemResponse]
    subtotal: float
    delivery: float
    discount: float
    total: float
