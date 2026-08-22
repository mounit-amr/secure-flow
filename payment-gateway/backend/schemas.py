from pydantic import BaseModel, Field, field_validator
from datetime import datetime

from country_utils import normalize_country_code


class PaymentCreate(BaseModel):
    sender_account: str
    receiver_account: str
    sender_name: str
    receiver_name: str
    amount: float = Field(..., gt=0)
    currency: str = "INR"
    sender_country: str = Field(..., min_length=2, max_length=2, pattern=r"^[A-Z]{2}$")
    receiver_country: str = Field(..., min_length=2, max_length=2, pattern=r"^[A-Z]{2}$")
    device_id: str
    session_id: str
    otp: str = "123456"

    @field_validator("sender_country", "receiver_country", mode="before")
    @classmethod
    def normalize_country_fields(cls, value: str) -> str:
        return normalize_country_code(value)


class TransactionResponse(BaseModel):
    transaction_id: str
    sender_account: str
    receiver_account: str
    sender_name: str
    receiver_name: str
    amount: float
    currency: str
    sender_country: str = Field(..., min_length=2, max_length=2, pattern=r"^[A-Z]{2}$")
    receiver_country: str = Field(..., min_length=2, max_length=2, pattern=r"^[A-Z]{2}$")
    timestamp: datetime
    device_id: str
    session_id: str
    status: str

    class Config:
        from_attributes = True