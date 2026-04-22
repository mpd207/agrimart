from pydantic import AliasChoices, BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


def _normalize_mobile(value: str) -> str:
    cleaned = "".join(ch for ch in str(value or "") if ch.isdigit())
    if len(cleaned) == 12 and cleaned.startswith("91"):
        cleaned = cleaned[2:]
    if len(cleaned) != 10:
        raise ValueError("Mobile number must be a valid 10-digit Indian number")
    return cleaned


# ── Auth ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    mobile: str = Field(validation_alias=AliasChoices("mobile", "mobile_number"))
    password: Optional[str] = None
    full_name: Optional[str] = Field(default=None, validation_alias=AliasChoices("full_name", "name"))
    pincode: Optional[str] = None
    farming_type: Optional[str] = None
    landsize_acres: Optional[str] = None

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value: str) -> str:
        return _normalize_mobile(value)


class LoginRequest(BaseModel):
    mobile: str = Field(validation_alias=AliasChoices("mobile", "mobile_number"))
    password: str

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value: str) -> str:
        return _normalize_mobile(value)


class OTPRequest(BaseModel):
    mobile: str = Field(validation_alias=AliasChoices("mobile", "mobile_number"))

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value: str) -> str:
        return _normalize_mobile(value)


class OTPRequestResponse(BaseModel):
    message: str
    delivery_mode: str
    dev_otp: Optional[str] = None


class OTPVerifyRequest(BaseModel):
    mobile: str = Field(validation_alias=AliasChoices("mobile", "mobile_number"))
    otp: str

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value: str) -> str:
        return _normalize_mobile(value)


class UserProfileResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    name: Optional[str] = None
    mobile: str
    mobile_number: str
    role: str = "farmer"
    pincode: Optional[str] = None
    farming_type: Optional[str] = None
    landsize_acres: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    pincode: Optional[str] = None
    farming_type: Optional[str] = None
    landsize_acres: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


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


class PriceTrendPoint(BaseModel):
    date: str
    price: float


class MarketTrendResponse(BaseModel):
    commodity: str
    name: str
    emoji: Optional[str]
    unit: str
    period_days: int
    current_price: float
    low_price: float
    high_price: float
    points: List[PriceTrendPoint]


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


class RecommendationResponse(BaseModel):
    item_type: str
    item_id: int
    title: str
    subtitle: str
    reason: str
    season_match: str
    emoji: Optional[str]
    price_label: str


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PriceAlertCreate(BaseModel):
    commodity: str
    target_price: float
    direction: str


class PriceAlertResponse(BaseModel):
    id: int
    commodity: str
    target_price: float
    direction: str
    is_enabled: bool
    last_triggered_price: Optional[float]
    created_at: datetime

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


class OrderItemResponse(BaseModel):
    id: int
    item_type: str
    item_id: int
    quantity: float
    unit_price: float
    item_name: str
    item_emoji: Optional[str]
    subtotal: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    status: str
    subtotal: float
    delivery: float
    discount: float
    total: float
    item_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse]


class AdminOrderResponse(OrderResponse):
    user_id: int


class OrderStatusUpdate(BaseModel):
    status: str
