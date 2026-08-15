from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, String

from database import Base


class UserAccount(Base):
    __tablename__ = "user_accounts"

    user_id = Column(String, primary_key=True, index=True)
    email = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    available_balance = Column(Float, default=0.0)
    is_frozen = Column(Boolean, default=False)
    trusted_device_fingerprint = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return (
            f"UserAccount(user_id={self.user_id!r}, full_name={self.full_name!r}, "
            f"is_frozen={self.is_frozen!r})"
        )
