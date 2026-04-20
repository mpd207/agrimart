from datetime import datetime

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.weather_snapshot import WeatherSnapshot

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


def current_month_key(now: datetime | None = None) -> str:
    current = now or datetime.utcnow()
    return f"{current.year:04d}-{current.month:02d}"


def derive_weather_profile(avg_temp_c: float | None, precipitation_mm: float | None):
    temp = avg_temp_c or 0.0
    rain = precipitation_mm or 0.0

    if rain >= 12:
        return {
            "weather_label": "active wet conditions with healthy moisture",
            "seed_boost": "Oilseed",
            "fert_boost": "Potassic",
        }
    if temp <= 24:
        return {
            "weather_label": "cool seasonal field conditions",
            "seed_boost": "Cereal",
            "fert_boost": "Phosphatic",
        }
    if temp >= 32:
        return {
            "weather_label": "warm to hot crop conditions",
            "seed_boost": "Vegetable",
            "fert_boost": "Complex",
        }
    return {
        "weather_label": "moderate seasonal conditions",
        "seed_boost": "Vegetable",
        "fert_boost": "Nitrogenous",
    }


async def _fetch_geocode(pincode: str):
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            GEOCODE_URL,
            params={"name": str(pincode), "count": 1, "language": "en", "format": "json", "countryCode": "IN"},
        )
        response.raise_for_status()
        payload = response.json()
        results = payload.get("results") or []
        if not results:
            return None
        return results[0]


async def _fetch_weather(latitude: float, longitude: float):
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            FORECAST_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                "forecast_days": 3,
                "timezone": "auto",
            },
        )
        response.raise_for_status()
        payload = response.json()
        daily = payload.get("daily") or {}
        max_temps = daily.get("temperature_2m_max") or []
        min_temps = daily.get("temperature_2m_min") or []
        rainfall = daily.get("precipitation_sum") or []
        avg_temp = None
        if max_temps and min_temps:
            combined = [(hi + lo) / 2 for hi, lo in zip(max_temps, min_temps)]
            avg_temp = round(sum(combined) / len(combined), 2)
        total_precipitation = round(sum(rainfall), 2) if rainfall else None
        return avg_temp, total_precipitation


async def get_weather_context_for_pincode(db: AsyncSession, pincode: str | None, season: str):
    if not pincode:
        return {
            "location_name": "your area",
            "region": "your area",
            "weather_label": "local seasonal conditions",
            "seed_boost": None,
            "fert_boost": None,
            "avg_temp_c": None,
            "precipitation_mm": None,
            "source": "fallback",
            "month_key": current_month_key(),
        }

    month_key = current_month_key()
    snapshot = (
        await db.execute(
            select(WeatherSnapshot)
            .where(WeatherSnapshot.pincode == str(pincode), WeatherSnapshot.month_key == month_key)
            .order_by(WeatherSnapshot.id.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if snapshot:
        return {
            "location_name": snapshot.location_name,
            "region": snapshot.region or snapshot.location_name,
            "weather_label": snapshot.weather_label,
            "seed_boost": snapshot.seed_boost,
            "fert_boost": snapshot.fert_boost,
            "avg_temp_c": snapshot.avg_temp_c,
            "precipitation_mm": snapshot.precipitation_mm,
            "source": snapshot.source,
            "month_key": snapshot.month_key,
        }

    try:
        geo = await _fetch_geocode(str(pincode))
        if not geo:
            raise ValueError("No matching geocode result")

        avg_temp, precipitation = await _fetch_weather(geo["latitude"], geo["longitude"])
        profile = derive_weather_profile(avg_temp, precipitation)
        location_name = geo.get("name") or str(pincode)
        region = geo.get("admin1") or geo.get("admin2") or geo.get("country") or location_name

        snapshot = WeatherSnapshot(
            pincode=str(pincode),
            month_key=month_key,
            location_name=location_name,
            region=region,
            latitude=geo["latitude"],
            longitude=geo["longitude"],
            season=season,
            weather_label=profile["weather_label"],
            seed_boost=profile["seed_boost"],
            fert_boost=profile["fert_boost"],
            avg_temp_c=avg_temp,
            precipitation_mm=precipitation,
            source="open-meteo",
        )
        db.add(snapshot)
        await db.commit()
        await db.refresh(snapshot)

        return {
            "location_name": snapshot.location_name,
            "region": snapshot.region or snapshot.location_name,
            "weather_label": snapshot.weather_label,
            "seed_boost": snapshot.seed_boost,
            "fert_boost": snapshot.fert_boost,
            "avg_temp_c": snapshot.avg_temp_c,
            "precipitation_mm": snapshot.precipitation_mm,
            "source": snapshot.source,
            "month_key": snapshot.month_key,
        }
    except Exception:
        profile = derive_weather_profile(None, None)
        return {
            "location_name": str(pincode),
            "region": str(pincode),
            "weather_label": profile["weather_label"],
            "seed_boost": profile["seed_boost"],
            "fert_boost": profile["fert_boost"],
            "avg_temp_c": None,
            "precipitation_mm": None,
            "source": "fallback",
            "month_key": month_key,
        }
