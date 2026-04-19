import httpx
from fastapi import HTTPException

from app.core.config import settings


async def send_sms(mobile: str, message: str) -> str:
    provider = settings.SMS_PROVIDER.lower()

    if provider in {"console", "dev"}:
        return "dev"

    if provider == "twilio" and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                url,
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                data={
                    "From": settings.TWILIO_FROM_NUMBER,
                    "To": mobile,
                    "Body": message,
                },
            )
            response.raise_for_status()
        return "sms"

    if provider == "msg91" and settings.MSG91_AUTH_KEY:
        payload = {
            "template_id": settings.MSG91_TEMPLATE_ID,
            "flow_id": settings.MSG91_FLOW_ID,
            "mobiles": mobile,
            "message": message,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://control.msg91.com/api/v5/flow/",
                headers={"authkey": settings.MSG91_AUTH_KEY, "content-type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
        return "sms"

    if provider == "twilio":
        raise HTTPException(status_code=503, detail="Twilio SMS is not configured")
    if provider == "msg91":
        raise HTTPException(status_code=503, detail="MSG91 SMS is not configured")

    raise HTTPException(status_code=503, detail=f"Unsupported SMS provider '{settings.SMS_PROVIDER}'")
