from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, default="")
    password = Column(String, nullable=False)
    role = Column(String, default="user")
    balance = Column(Float, default=0.0)
    upi_id = Column(String, nullable=True)
    health_score = Column(Float, default=80.0)
    joined_at = Column(String, default=lambda: datetime.utcnow().date().isoformat())
    created_at = Column(DateTime, default=datetime.utcnow)

    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    last4 = Column(String, default="")
    balance = Column(Float, default=0.0)
    status = Column(String, default="active")
    icon = Column(String, default="💳")
    account_number = Column(String, nullable=True)
    security_pin = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="accounts")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    from_user_id = Column(String, nullable=True)
    to_user_id = Column(String, nullable=True)
    from_name = Column(String, default="")
    to_name = Column(String, default="")
    account_id = Column(String, nullable=True)
    account_name = Column(String, default="")
    merchant = Column(String, default="")
    amount = Column(Float, default=0.0)
    direction = Column(String, default="out")
    date = Column(String, nullable=False)
    day = Column(String, default="")
    location = Column(String, default="")
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="low")
    status = Column(String, default="completed")
    category = Column(String, default="")
    note = Column(Text, default="")
    explainable = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AppState(Base):
    __tablename__ = "app_state"

    id = Column(String, primary_key=True, default="default")
    payload = Column(JSON, default={})
    session_user_id = Column(String, nullable=True)
    is_global_frozen = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
