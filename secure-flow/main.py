from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, cast

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import Depends, FastAPI, Header, HTTPException, status
from sklearn.ensemble import RandomForestClassifier
from sqlalchemy.orm import Session

import database
import models
import schemas
from database import redis_client

ml_assets: Dict[str, Any] = {}

REASON_MAP = {
    "velocity_1h": "Unusual burst of transfers in the last hour",
    "new_beneficiary": "First-time transfer to an unverified recipient",
    "location_distance_km": "Location mismatch from your usual login city",
    "typing_cadence_variance": "Erratic navigation or typing patterns detected",
    "active_screenshare": "Active screen-sharing application detected",
}

FEATURES = list(REASON_MAP.keys())
MODEL_PATH = Path(os.getenv("SECUREFLOW_MODEL_PATH", Path(__file__).resolve().parent / "artifacts" / "fraud_model.joblib"))
LOG_PATH = Path(os.getenv("SECUREFLOW_LOG_PATH", Path(__file__).resolve().parent / "artifacts" / "xai_events.jsonl"))


def _train_dummy_model() -> RandomForestClassifier:
    rng = np.random.default_rng(42)
    X_dummy = rng.random((200, len(FEATURES)))
    y_dummy = rng.integers(0, 2, size=200)

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight="balanced",
    )
    clf.fit(X_dummy, y_dummy)
    return clf


def _ensure_storage_paths() -> None:
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)


def _load_model_bundle() -> Dict[str, Any]:
    _ensure_storage_paths()

    if MODEL_PATH.exists():
        try:
            payload = joblib.load(MODEL_PATH)
            if isinstance(payload, dict):
                model = payload.get("model")
                explainer = payload.get("explainer")
                feature_names = payload.get("feature_names") or FEATURES
                if model is not None and explainer is not None:
                    return {"model": model, "explainer": explainer, "feature_names": feature_names}
        except Exception:
            pass

    model = _train_dummy_model()
    explainer = shap.TreeExplainer(model)
    return {"model": model, "explainer": explainer, "feature_names": FEATURES}


def _extract_feature_impacts(explainer: Any, feature_df: pd.DataFrame) -> np.ndarray:
    try:
        raw_shap = explainer.shap_values(feature_df)

        if isinstance(raw_shap, list):
            impacts = np.asarray(raw_shap[1]).reshape(-1)
        elif isinstance(raw_shap, np.ndarray):
            if raw_shap.ndim == 3:
                impacts = np.asarray(raw_shap[0, :, 1]).reshape(-1)
            else:
                impacts = np.asarray(raw_shap[0]).reshape(-1)
        else:
            impacts = np.asarray(raw_shap).reshape(-1)

        return impacts[: len(FEATURES)]
    except Exception:
        return np.zeros(len(FEATURES), dtype=float)


def _log_xai_event(event: Dict[str, Any]) -> None:
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as log_file:
            log_file.write(json.dumps(event, default=str) + "\n")
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    bundle = _load_model_bundle()
    ml_assets["model"] = bundle["model"]
    ml_assets["explainer"] = bundle["explainer"]
    ml_assets["feature_names"] = bundle["feature_names"]
    yield
    ml_assets.clear()


app = FastAPI(
    title="SecureFlow Fraud & XAI Engine",
    version="1.3.0",
    description="Fraud risk evaluation with SHAP-based explainability and payment safeguards.",
    lifespan=lifespan,
)


@app.get("/health")
async def healthcheck() -> dict:
    return {
        "status": "ok",
        "model_loaded": "model" in ml_assets,
        "version": app.version,
        "redis_connected": redis_client is not None,
    }


@app.post("/api/v1/analyze-transaction", response_model=schemas.AnalyzeTransactionResponse)
async def analyze_transaction(data: schemas.TransactionTelemetry):
    try:
        model = ml_assets["model"]
        explainer = ml_assets["explainer"]
        features = ml_assets["feature_names"]

        input_data = {feature: [getattr(data, feature)] for feature in features}
        input_df = pd.DataFrame(input_data)

        risk_proba = float(model.predict_proba(input_df)[0][1])
        impacts = _extract_feature_impacts(explainer, input_df)

        ordered_indices = np.argsort(impacts)[::-1]
        top_reasons: List[schemas.XaiDetail] = []

        for idx in ordered_indices:
            if impacts[idx] <= 0:
                continue
            feature_name = features[idx]
            top_reasons.append(
                schemas.XaiDetail(
                    feature=feature_name,
                    reason=REASON_MAP.get(feature_name, feature_name),
                    shap_value=float(impacts[idx]),
                )
            )
            if len(top_reasons) == 2:
                break

        if risk_proba >= 0.70:
            tier = "HIGH"
            action = "ONE_TAP_FREEZE"
        elif risk_proba >= 0.30:
            tier = "MEDIUM"
            action = "STEP_UP_VERIFICATION"
        else:
            tier = "LOW"
            action = "PROCEED_SEAMLESS"

        response = schemas.AnalyzeTransactionResponse(
            transaction_id=data.transaction_id,
            risk_score=round(risk_proba, 3),
            risk_tier=tier,
            action_required=action,
            xai_summary=" + ".join(item.reason for item in top_reasons) if top_reasons else "Normal baseline behavior",
            xai_details=top_reasons,
            model_version=app.version,
        )

        _log_xai_event(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "transaction_id": data.transaction_id,
                "risk_score": response.risk_score,
                "risk_tier": response.risk_tier,
                "action_required": response.action_required,
                "xai_summary": response.xai_summary,
                "xai_details": [detail.model_dump() for detail in response.xai_details],
            }
        )

        return response

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fraud analysis failed: {exc}") from exc


@app.post(
    "/v1/payments/evaluate",
    response_model=schemas.EvaluateResponse,
    status_code=status.HTTP_200_OK,
)
async def evaluate_payment(
    tx: schemas.TransactionRequest,
    x_device_fingerprint: str = Header(..., description="Hardware hash unique to device"),
    db: Session = Depends(database.get_db),
):
    # 1. Ensure current_time is calculated at the very top
    current_time = datetime.now(timezone.utc).timestamp()


    # 2. Database validation layer
    user = db.query(models.UserAccount).filter(models.UserAccount.user_id == tx.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if cast(bool,user.is_frozen):
        raise HTTPException(status_code=403, detail="Account is strictly locked due to security anomalies.")

    if user.trusted_device_fingerprint and duser.trusted_device_fingerprint != x_device_fingerprint:
        return schemas.EvaluateResponse(
            status="CHALLENGE_REQUIRED",
            action_required="STEP_UP_MFA",
            reason="Unrecognized hardware signature detected for high-value transfer.",
        )

    # Initialize tracking defaults in case Redis is offline
    simulated_distance_km = 0.0
    recent_tx_count = 0.0  # <--- CRITICAL: Defines a fallback value so it's never undefined!

    # 3. Secure Redis In-Flight Calculations Block
    if redis_client is not None:
        # A. TRACK VELOCITY ENGINE (Defines recent_tx_count)
        velocity_key = f"user:{tx.user_id}:tx_velocity"
        redis_client.zadd(velocity_key, {f"{current_time}:{tx.recipient_account}": current_time})
        redis_client.zremrangebyscore(velocity_key, "-inf", current_time - 3600)  
        recent_tx_count = float(redis_client.zcard(velocity_key))

        # B. TRACK COUNTRY GEOLOCATION ANOMALY
        geo_key = f"user:{tx.user_id}:last_country"
        last_country_data = redis_client.get(geo_key)
        
        if last_country_data:
            historical_record = json.loads(str(last_country_data))
            if historical_record["country"] != tx.current_country:
                time_diff_hours = (current_time - historical_record["timestamp"]) / 3600.0
                if time_diff_hours < 12.0:
                    simulated_distance_km = 999.0

        # Update spatial footprint history
        redis_client.set(geo_key, json.dumps({
            "country": tx.current_country, 
            "timestamp": current_time
        }))

        # 4. INGEST EVERYTHING INTO ML & SHAP DATAFRAME
        model = ml_assets.get("model")
        explainer = ml_assets.get("explainer")
        features = ml_assets.get("feature_names") or FEATURES

        tx_id = f"tx_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"

        ml_input_data = {
            "velocity_1h": [recent_tx_count],                  # Now perfectly visible and safe
            "new_beneficiary": [1 if recent_tx_count <= 1 else 0],  
            "location_distance_km": [simulated_distance_km],         
            "typing_cadence_variance": [float(tx.typing_hesitation_ms)],
            "active_screenshare": [1 if tx.screen_sharing_active else 0]
        }
        input_df = pd.DataFrame(ml_input_data)

        # Run model scoring metrics
        risk_proba = float(model.predict_proba(input_df)[0][1]) if model else 0.0
        impacts = _extract_feature_impacts(explainer, input_df) if explainer else np.zeros(len(features))

        # 5. Pipeline Circuit Breaker Operations
        if risk_proba >= 0.70 or (tx.is_on_active_call and tx.screen_sharing_active) or simulated_distance_km > 0:
            quarantine_key = f"quarantine:{tx_id}"

            quarantine_payload = schemas.QuarantinedTransaction(
                transaction_id=tx_id,
                user_id=tx.user_id,
                amount=tx.amount,
                recipient_account=tx.recipient_account,
                timestamp=current_time
            )
            
            # Lock the transfer inside your Redis Quarantine Ledger for 15 minutes
            redis_client.setex(quarantine_key, 900, quarantine_payload.model_dump_json())

            # Generate explainable text metrics using SHAP
            ordered_indices = np.argsort(impacts)[::-1]
            flagged_reasons = [
                REASON_MAP.get(features[i], features[i]) 
                for i in ordered_indices if impacts[i] > 0
            ]
            primary_reason = flagged_reasons[0] if flagged_reasons else "High risk indicators flagged"

            return schemas.EvaluateResponse(
                status="QUARANTINED",
                action_required="TRIGGER_SHIELD_UI",
                reason=f"Safety Lock Activated: {primary_reason}.",
                remaining_seconds=900
            )

    return schemas.EvaluateResponse(
        status="APPROVED",
        reason="Transaction parameters standard. Payout authorized."
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
