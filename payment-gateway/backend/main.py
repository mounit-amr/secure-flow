from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid
import datetime
import uvicorn

from database import engine, Base, get_db
import models
import schemas
from websocket_manager import manager

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Simulated Payment Gateway Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/transactions", response_model=schemas.TransactionResponse, status_code=201)
async def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    if payment.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP. Use Demo OTP: 123456")

    txn_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    current_time = datetime.datetime.utcnow()

    db_transaction = models.Transaction(
        transaction_id=txn_id,
        sender_account=payment.sender_account,
        receiver_account=payment.receiver_account,
        sender_name=payment.sender_name,
        receiver_name=payment.receiver_name,
        amount=payment.amount,
        currency=payment.currency.upper(),
        sender_country=payment.sender_country,
        receiver_country=payment.receiver_country,
        timestamp=current_time,
        device_id=payment.device_id,
        session_id=payment.session_id,
        status="SUCCESS"
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    response_data = schemas.TransactionResponse.model_validate(db_transaction)
    
    await manager.broadcast({
        "event": "transaction_created",
        "transaction": response_data.model_dump(mode="json")
    })

    return response_data

@app.get("/api/transactions", response_model=List[schemas.TransactionResponse])
def get_all_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Transaction).order_by(models.Transaction.timestamp.desc()).offset(skip).limit(limit).all()

@app.websocket("/ws/transactions")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)