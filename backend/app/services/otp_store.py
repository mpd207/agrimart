import json
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User

try:
    import redis.asyncio as redis
except Exception:  # pragma: no cover
    redis = None


_redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True) if redis and settings.REDIS_URL else None


def _otp_key(mobile: str) -> str:
    return f"otp:{mobile}"


async def save_otp(db: AsyncSession, user: User, otp: str, expires_at: datetime) -> None:
    if _redis_client:
        ttl_seconds = max(int((expires_at - datetime.utcnow()).total_seconds()), 1)
        payload = {"otp": otp, "expires_at": expires_at.isoformat()}
        await _redis_client.set(_otp_key(user.mobile), json.dumps(payload), ex=ttl_seconds)
        return

    user.otp_code = otp
    user.otp_expires_at = expires_at
    await db.commit()


async def read_otp(db: AsyncSession, user: User) -> tuple[str | None, datetime | None]:
    if _redis_client:
        raw = await _redis_client.get(_otp_key(user.mobile))
        if not raw:
            return None, None
        payload = json.loads(raw)
        expires_at = datetime.fromisoformat(payload["expires_at"])
        if expires_at.tzinfo is not None:
            expires_at = expires_at.astimezone(timezone.utc).replace(tzinfo=None)
        return payload.get("otp"), expires_at

    return user.otp_code, user.otp_expires_at


async def clear_otp(db: AsyncSession, user: User) -> None:
    if _redis_client:
        await _redis_client.delete(_otp_key(user.mobile))
        return

    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
