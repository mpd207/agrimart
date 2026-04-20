from sqlalchemy import Column, DateTime, Float, Integer, String, func

from app.core.database import Base


class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    pincode = Column(String, index=True, nullable=False)
    month_key = Column(String, index=True, nullable=False)
    location_name = Column(String, nullable=False)
    region = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    season = Column(String, nullable=False)
    weather_label = Column(String, nullable=False)
    seed_boost = Column(String, nullable=True)
    fert_boost = Column(String, nullable=True)
    avg_temp_c = Column(Float, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    source = Column(String, nullable=False, default="open-meteo")
    created_at = Column(DateTime, server_default=func.now())
