from __future__ import annotations

from datetime import datetime
import json
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine, get_db
from .models import Account, AppState, Transaction, User

Base.metadata.create_all(bind=engine)


def seed_demo_data() -> None:
    db = SessionLocal()
    try:
        demo_users = [
            {
                "id": "user_1",
                "name": "Aarav Sharma",
                "email": "aarav@secureflow.app",
                "phone": "+91 98765 43210",
                "password": "user1",
                "role": "user",
                "balance": 12500.5,
                "upiId": "aarav@okaxis",
                "healthScore": 78,
                "joinedAt": "2026-01-15",
            },
            {
                "id": "user_2",
                "name": "Ved Patel",
                "email": "ved@secureflow.app",
                "phone": "+91 91234 56789",
                "password": "user2",
                "role": "user",
                "balance": 8420.0,
                "upiId": "ved@paytm",
                "healthScore": 85,
                "joinedAt": "2026-02-01",
            },
            {
                "id": "admin_1",
                "name": "Rohan Mehta",
                "email": "admin@secureflow.app",
                "phone": "+91 90000 00000",
                "password": "admin",
                "role": "admin",
                "balance": 0,
                "healthScore": 100,
                "joinedAt": "2025-11-01",
            },
        ]
        for payload in demo_users:
            if not db.query(User).filter(User.id == payload["id"]).first():
                upsert_user(db, payload)

        ved = db.query(User).filter(User.id == "user_2").first()
        if ved:
            ved.name = "Ved Patel"
            ved.email = "ved@secureflow.app"
            ved.phone = "+91 91234 56789"
            ved.upi_id = "ved@paytm"
            db.commit()

        obsolete_account_ids = ["acc_1b", "acc_1c", "acc_2b", "acc_2c"]
        db.query(Transaction).filter(Transaction.account_id.in_(obsolete_account_ids)).delete(
            synchronize_session=False
        )
        db.query(Account).filter(Account.id.in_(obsolete_account_ids)).delete(
            synchronize_session=False
        )
        db.commit()

        demo_accounts = [
            ("user_1", "acc_1a", "HDFC Salary", "Bank", "4821", 8450.5, "🏦", "1234"),
            ("user_2", "acc_2a", "Ved Wallet", "Wallet", "9033", 5200.0, "💳", "1234"),
        ]
        for user_id, account_id, name, account_type, last4, balance, icon, pin in demo_accounts:
            if not db.query(Account).filter(Account.id == account_id).first():
                upsert_account(
                    db,
                    user_id,
                    {
                        "id": account_id,
                        "name": name,
                        "type": account_type,
                        "last4": last4,
                        "balance": balance,
                        "status": "active",
                        "icon": icon,
                        "accountNumber": last4,
                        "securityPin": pin,
                    },
                )


        # Ensure every account has default security PIN 1234 (users can change later in Settings)
        for acc in db.query(Account).all():
            acc.security_pin = "1234"
        db.commit()

        demo_transactions = [
            {
                "id": "txn_demo_in_1",
                "fromUserId": "user_2",
                "toUserId": "user_1",
                "fromName": "Ved Patel",
                "toName": "Aarav Sharma",
                "accountId": "acc_1a",
                "accountName": "HDFC Salary",
                "merchant": "Received from Ved Patel",
                "amount": 500,
                "direction": "in",
                "date": "2026-08-14T10:30:00",
                "day": "Friday",
                "location": "Mumbai, Maharashtra, India",
                "riskScore": 8,
                "riskLevel": "low",
                "status": "completed",
                "category": "P2P",
            },
            {
                "id": "txn_demo_out_1",
                "fromUserId": "user_1",
                "toUserId": "user_2",
                "fromName": "Aarav Sharma",
                "toName": "Ved Patel",
                "accountId": "acc_1a",
                "accountName": "HDFC Salary",
                "merchant": "Sent to Ved Patel",
                "amount": -250,
                "direction": "out",
                "date": "2026-08-13T16:45:00",
                "day": "Thursday",
                "location": "Bengaluru, Karnataka, India",
                "riskScore": 12,
                "riskLevel": "low",
                "status": "completed",
                "category": "P2P",
            },
            {
                "id": "txn_demo_in_2",
                "fromUserId": "user_1",
                "toUserId": "user_2",
                "fromName": "Aarav Sharma",
                "toName": "Ved Patel",
                "accountId": "acc_2a",
                "accountName": "SBI Savings",
                "merchant": "Received from Aarav Sharma",
                "amount": 250,
                "direction": "in",
                "date": "2026-08-13T16:45:00",
                "day": "Thursday",
                "location": "Bengaluru, Karnataka, India",
                "riskScore": 5,
                "riskLevel": "low",
                "status": "completed",
                "category": "P2P",
            },
            {
                "id": "txn_aarav_risk_low",
                "fromUserId": "user_2",
                "toUserId": "user_1",
                "fromName": "Ved Patel",
                "toName": "Aarav Sharma",
                "accountId": "acc_1a",
                "accountName": "HDFC Salary",
                "merchant": "Received from Ved Patel",
                "amount": 120,
                "direction": "in",
                "date": "2026-08-18T10:15:00",
                "day": "Tuesday",
                "location": "Pune, Maharashtra, India",
                "riskScore": 12,
                "riskLevel": "low",
                "status": "completed",
                "category": "P2P",
                "note": "Low-risk demo transaction",
            },
            {
                "id": "txn_aarav_risk_medium",
                "fromUserId": None,
                "toUserId": "user_1",
                "fromName": "Merchant",
                "toName": "Aarav Sharma",
                "accountId": "acc_1a",
                "accountName": "HDFC Salary",
                "merchant": "Online purchase · New device",
                "amount": -850,
                "direction": "out",
                "date": "2026-08-17T21:20:00",
                "day": "Monday",
                "location": "Delhi, India",
                "riskScore": 48,
                "riskLevel": "medium",
                "status": "pending_verification",
                "category": "Card",
                "note": "Medium-risk demo transaction",
            },
            {
                "id": "txn_aarav_risk_high",
                "fromUserId": None,
                "toUserId": "user_1",
                "fromName": "External",
                "toName": "Aarav Sharma",
                "accountId": "acc_1a",
                "accountName": "HDFC Salary",
                "merchant": "Wire transfer · Unusual recipient",
                "amount": -3200,
                "direction": "out",
                "date": "2026-08-16T23:05:00",
                "day": "Sunday",
                "location": "Lagos, Nigeria",
                "riskScore": 76,
                "riskLevel": "high",
                "status": "flagged",
                "category": "Transfer",
                "note": "High-risk demo transaction",
            },
            {
                "id": "txn_aarav_risk_critical",
                "fromUserId": None,
                "toUserId": "user_1",
                "fromName": "External",
                "toName": "Aarav Sharma",
                "accountId": "acc_1a",
                "accountName": "HDFC Salary",
                "merchant": "Card-not-present · Blocked location",
                "amount": -7800,
                "direction": "out",
                "date": "2026-08-15T03:40:00",
                "day": "Saturday",
                "location": "Moscow, Russia",
                "riskScore": 96,
                "riskLevel": "critical",
                "status": "flagged",
                "category": "Transfer",
                "note": "Critical-risk demo transaction",
            },
        ]
        for payload in demo_transactions:
            if not db.query(Transaction).filter(Transaction.id == payload["id"]).first():
                upsert_transaction(db, payload)
    finally:
        db.close()
app = FastAPI(title="SecureFlow API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    securityPin: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AppStatePayload(BaseModel):
    users: list[dict[str, Any]] | None = None
    accountsByUser: dict[str, list[dict[str, Any]]] | None = None
    allTransactions: list[dict[str, Any]] | None = None
    settings: dict[str, Any] | None = None
    sessionUserId: str | None = None
    isGlobalFrozen: bool = False


def user_to_dict(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email or "",
        "phone": user.phone or "",
        "password": user.password,
        "role": user.role,
        "balance": float(user.balance or 0),
        "upiId": user.upi_id,
        "healthScore": float(user.health_score or 80),
        "joinedAt": user.joined_at,
    }


def account_to_dict(account: Account) -> dict[str, Any]:
    return {
        "id": account.id,
        "name": account.name,
        "type": account.type,
        "last4": account.last4 or "",
        "balance": float(account.balance or 0),
        "status": account.status,
        "icon": account.icon,
        "accountNumber": account.account_number,
        "securityPin": account.security_pin or "1234",
    }


def transaction_to_dict(txn: Transaction) -> dict[str, Any]:
    return {
        "id": txn.id,
        "fromUserId": txn.from_user_id,
        "toUserId": txn.to_user_id,
        "fromName": txn.from_name,
        "toName": txn.to_name,
        "accountId": txn.account_id,
        "accountName": txn.account_name,
        "merchant": txn.merchant,
        "amount": float(txn.amount or 0),
        "direction": txn.direction,
        "date": txn.date,
        "day": txn.day,
        "location": txn.location,
        "riskScore": float(txn.risk_score or 0),
        "riskLevel": txn.risk_level,
        "status": txn.status,
        "category": txn.category,
        "note": txn.note,
        "explainable": txn.explainable,
    }


def upsert_user(db: Session, payload: dict[str, Any]) -> User:
    user_id = str(payload.get("id") or f"user_{int(datetime.utcnow().timestamp() * 1000)}")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        user = User(id=user_id)
        db.add(user)

    user.name = payload.get("name") or user.name
    if payload.get("email"):
        user.email = payload["email"].lower()
    user.phone = payload.get("phone") or user.phone or ""
    user.password = payload.get("password") or user.password
    user.role = payload.get("role") or user.role or "user"
    user.balance = float(payload.get("balance") or user.balance or 0)
    user.upi_id = payload.get("upiId") or payload.get("upi_id") or user.upi_id
    user.health_score = float(payload.get("healthScore") or payload.get("health_score") or user.health_score or 80)
    user.joined_at = payload.get("joinedAt") or user.joined_at or datetime.utcnow().date().isoformat()
    db.commit()
    db.refresh(user)
    return user


def upsert_account(db: Session, user_id: str, payload: dict[str, Any]) -> Account:
    account_id = str(payload.get("id") or f"acc_{int(datetime.utcnow().timestamp() * 1000)}")
    account = db.query(Account).filter(Account.id == account_id).first()
    if account is None:
        account = Account(id=account_id, user_id=user_id)
        db.add(account)

    account.name = payload.get("name") or account.name
    account.type = payload.get("type") or account.type
    account.last4 = payload.get("last4") or account.last4 or ""
    account.balance = float(payload.get("balance") or account.balance or 0)
    account.status = payload.get("status") or account.status or "active"
    account.icon = payload.get("icon") or account.icon or "💳"
    account.account_number = payload.get("accountNumber") or payload.get("account_number") or account.account_number
    account.security_pin = payload.get("securityPin") or payload.get("security_pin") or account.security_pin or "1234"
    db.commit()
    db.refresh(account)
    return account


def upsert_transaction(db: Session, payload: dict[str, Any]) -> Transaction:
    txn_id = str(payload.get("id") or f"txn_{int(datetime.utcnow().timestamp() * 1000)}")
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if txn is None:
        txn = Transaction(id=txn_id)
        db.add(txn)

    txn.from_user_id = payload.get("fromUserId")
    txn.to_user_id = payload.get("toUserId")
    txn.from_name = payload.get("fromName") or ""
    txn.to_name = payload.get("toName") or ""
    txn.account_id = payload.get("accountId")
    txn.account_name = payload.get("accountName") or ""
    txn.merchant = payload.get("merchant") or ""
    txn.amount = float(payload.get("amount") or 0)
    txn.direction = payload.get("direction") or "out"
    txn.date = payload.get("date") or datetime.utcnow().isoformat()
    txn.day = payload.get("day") or ""
    txn.location = payload.get("location") or ""
    txn.risk_score = float(payload.get("riskScore") or 0)
    txn.risk_level = payload.get("riskLevel") or "low"
    txn.status = payload.get("status") or "completed"
    txn.category = payload.get("category") or ""
    txn.note = payload.get("note") or ""
    txn.explainable = payload.get("explainable") or None
    db.commit()
    db.refresh(txn)
    return txn


seed_demo_data()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/v1/app-state")
def get_app_state(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.name).all()
    accounts_by_user: dict[str, list[dict[str, Any]]] = {}
    for user in users:
        accounts_by_user[user.id] = [account_to_dict(acc) for acc in user.accounts]

    transactions = db.query(Transaction).order_by(Transaction.date.desc()).all()
    state_row = db.query(AppState).filter(AppState.id == "default").first()
    settings = (state_row.payload or {}).get("settings", {}) if state_row else {}
    session_user_id = (state_row.payload or {}).get("sessionUserId") if state_row else None
    is_global_frozen = bool((state_row.payload or {}).get("isGlobalFrozen", False)) if state_row else False

    return {
        "users": [user_to_dict(u) for u in users],
        "accountsByUser": accounts_by_user,
        "allTransactions": [transaction_to_dict(t) for t in transactions],
        "settings": settings,
        "sessionUserId": session_user_id,
        "isGlobalFrozen": is_global_frozen,
    }


@app.put("/api/v1/app-state")
def put_app_state(payload: AppStatePayload, db: Session = Depends(get_db)):
    if payload.users:
        for item in payload.users:
            upsert_user(db, item)

    if payload.accountsByUser:
        for user_id, items in payload.accountsByUser.items():
            for item in items or []:
                upsert_account(db, str(user_id), item)

    if payload.allTransactions:
        for item in payload.allTransactions:
            upsert_transaction(db, item)

    state_row = db.query(AppState).filter(AppState.id == "default").first()
    if state_row is None:
        state_row = AppState(id="default")
        db.add(state_row)

    state_row.payload = {
        "users": payload.users or [],
        "accountsByUser": payload.accountsByUser or {},
        "allTransactions": payload.allTransactions or [],
        "settings": payload.settings or {},
        "sessionUserId": payload.sessionUserId,
        "isGlobalFrozen": payload.isGlobalFrozen,
    }
    state_row.session_user_id = payload.sessionUserId
    state_row.is_global_frozen = payload.isGlobalFrozen
    state_row.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "saved": True}


@app.post("/api/v1/auth/register")
def register_user(data: UserCreate, db: Session = Depends(get_db)):
    name = data.name.strip()
    email = str(data.email).strip().lower()
    phone = data.phone.strip()
    password = data.password.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(phone.replace("+", "").replace(" ", "").replace("-", "")) < 10:
        raise HTTPException(status_code=400, detail="Enter a valid mobile number")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not data.securityPin.isdigit() or len(data.securityPin) not in (4, 5, 6):
        raise HTTPException(status_code=400, detail="PIN must be 4 to 6 digits")

    user = User(
        id=f"user_{int(datetime.utcnow().timestamp() * 1000)}",
        name=name,
        email=email,
        phone=phone,
        password=password,
        role="user",
        balance=0.0,
        health_score=80.0,
        joined_at=datetime.utcnow().date().isoformat(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    default_account = Account(
        id=f"acc_{int(datetime.utcnow().timestamp() * 1000)}",
        user_id=user.id,
        name="Primary Wallet",
        type="Wallet",
        last4="0001",
        balance=1000.0,
        status="active",
        icon="💳",
        account_number="primary-wallet",
        security_pin=data.securityPin,
    )
    db.add(default_account)
    db.commit()

    return {"user": user_to_dict(user), "account": account_to_dict(default_account)}


@app.post("/api/v1/auth/login")
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    email = (data.email or "").strip().lower()
    if not email or not data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = db.query(User).filter(func.lower(User.email) == email).first()
    if user is None or user.password != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    state_row = db.query(AppState).filter(AppState.id == "default").first()
    if state_row is None:
        state_row = AppState(id="default", session_user_id=user.id, is_global_frozen=False)
        db.add(state_row)
    else:
        state_row.session_user_id = user.id
        state_row.updated_at = datetime.utcnow()
    db.commit()

    return {"user": user_to_dict(user)}


@app.post("/api/v1/auth/logout")
def logout_user(db: Session = Depends(get_db)):
    state_row = db.query(AppState).filter(AppState.id == "default").first()
    if state_row is None:
        state_row = AppState(id="default")
        db.add(state_row)
    state_row.session_user_id = None
    state_row.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@app.get("/")
def root():
    return {"message": "SecureFlow Backend"}
