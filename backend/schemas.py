from pydantic import BaseModel, Field
from datetime import datetime

class PaymentCreate(BaseModel):
    sender_account: str
    receiver_account: str
    sender_name: str
    receiver_name: str
    amount: float = Field(..., gt=0)
    currency: str = "INR"
    sender_country: str
    receiver_country: str
    device_id: str
    session_id: str
    otp: str = "123456"

class TransactionResponse(BaseModel):
    transaction_id: str
    sender_account: str
    receiver_account: str
    sender_name: str
    receiver_name: str
    amount: float
    currency: str
    sender_country: str
    receiver_country: str
    timestamp: datetime
    device_id: str
    session_id: str
    status: str

    class Config:
        from_attributes = True