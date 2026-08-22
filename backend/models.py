from sqlalchemy import Column, String, Float, DateTime
from database import Base
import datetime

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    sender_account = Column(String, index=True, nullable=False)
    receiver_account = Column(String, index=True, nullable=False)
    sender_name = Column(String, nullable=False)
    receiver_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    sender_country = Column(String(2), nullable=False)
    receiver_country = Column(String(2), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    device_id = Column(String, nullable=False)
    session_id = Column(String, nullable=False)
    status = Column(String, default="SUCCESS", nullable=False)