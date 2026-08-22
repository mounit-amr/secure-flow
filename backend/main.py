from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import httpx
import datetime
import sys
import uuid
from pathlib import Path

import uvicorn

from database import engine, Base, get_db
import models
import schemas
from country_utils import normalize_country_code
from websocket_manager import manager

app = FastAPI(title="Simulated Payment Gateway Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECUREFLOW_BACKEND_URL = "http://127.0.0.1:8001/api/v1/analyze-transaction"

@app.post("/api/proxy-analyze")
async def proxy_analyze(payload: dict):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(SECUREFLOW_BACKEND_URL, json=payload)
            return response.json()
    except Exception as e:
        print(f"Proxy error connecting to SecureFlow: {e}")
        raise HTTPException(status_code=502, detail=f"SecureFlow unreachable: {str(e)}")

# Database tables and static mounting below this...
Base.metadata.create_all(bind=engine)


if getattr(sys, "frozen", False):
    BASE_PATH = Path(sys._MEIPASS)
else:
    BASE_PATH = Path(__file__).resolve().parent.parent

FRONTEND_DIR = BASE_PATH / "frontend"
if not FRONTEND_DIR.exists():
    FRONTEND_DIR = Path(__file__).resolve().parent / "frontend"
print(f"FRONTEND_DIR: {FRONTEND_DIR}")

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
    if (FRONTEND_DIR / "css").exists():
        app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    if (FRONTEND_DIR / "js").exists():
        app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")

SECUREFLOW_EVALUATE_URL = "http://127.0.0.1:8000/api/evaluate"


@app.get("/")
async def serve_index():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return HTMLResponse(f"<h3>Index file missing at {index_file}</h3>", status_code=404)


@app.get("/transactions")
async def serve_transactions():
    transactions_file = FRONTEND_DIR / "transactions.html"
    if transactions_file.exists():
        return FileResponse(str(transactions_file))
    return HTMLResponse(f"<h3>Transactions file missing at {transactions_file}</h3>", status_code=404)


@app.post("/api/process-payment")
async def process_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                SECUREFLOW_EVALUATE_URL,
                json=payment.model_dump(),
            )
            response.raise_for_status()
            fraud_result = response.json()
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail="Fraud detection engine is offline or unreachable.",
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail="Fraud detection engine returned an error.",
        ) from exc

    risk_score = fraud_result.get("risk_score", fraud_result.get("fraud_score"))
    reasons = fraud_result.get("reasons", [])
    is_blocked = fraud_result.get("is_fraud") is True or fraud_result.get("action") == "BLOCK"

    if is_blocked:
        return {
            "status": "DECLINED",
            "risk_score": risk_score,
            "reasons": reasons,
        }

    transaction = await create_payment(payment, db)
    return {
        **transaction.model_dump(mode="json"),
        "status": "APPROVED",
        "risk_score": risk_score,
        "reasons": reasons,
    }

@app.post("/api/transactions", response_model=schemas.TransactionResponse, status_code=201)
async def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    if payment.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP. Use Demo OTP: 123456")

    txn_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    current_time = datetime.datetime.utcnow()
    sender_country_code = normalize_country_code(payment.sender_country)
    receiver_country_code = normalize_country_code(payment.receiver_country)

    db_transaction = models.Transaction(
        transaction_id=txn_id,
        sender_account=payment.sender_account,
        receiver_account=payment.receiver_account,
        sender_name=payment.sender_name,
        receiver_name=payment.receiver_name,
        amount=payment.amount,
        currency=payment.currency.upper(),
        sender_country=sender_country_code,
        receiver_country=receiver_country_code,
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
    uvicorn.run(app, host="127.0.0.1", port=8005, log_level="error")