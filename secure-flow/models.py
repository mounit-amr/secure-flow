from sqlalchemy import Column, String, Float, Boolean, DateTime
from datetime import datetime
from database import Base

class UserAccount(Base):
    __tablename__ = "user_accounts"

    user_id = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    available_balance = Column(Float, default=0.0)
    is_frozen = Column(Boolean, default=False)
    trusted_device_fingerprint = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
