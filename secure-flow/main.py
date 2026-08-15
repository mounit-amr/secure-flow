from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier

# In-memory holders for all ML assets loaded once on startup.
ml_assets: Dict[str, Any] = {}

# Human-readable mapping used to explain the top fraud drivers.
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


class TransactionTelemetry(BaseModel):
    transaction_id: str = Field(..., min_length=1)
    velocity_1h: float = Field(..., ge=0.0)
    new_beneficiary: int = Field(..., ge=0, le=1)
    location_distance_km: float = Field(..., ge=0.0)
    typing_cadence_variance: float = Field(..., ge=0.0)
    active_screenshare: int = Field(..., ge=0, le=1)


class XaiDetail(BaseModel):
    feature: str
    reason: str
    shap_value: float


class AnalyzeTransactionResponse(BaseModel):
    transaction_id: str
    risk_score: float
    risk_tier: str
    action_required: str
    xai_summary: str
    xai_details: List[XaiDetail]
    model_version: str


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
                    return {
                        "model": model,
                        "explainer": explainer,
                        "feature_names": feature_names,
                    }
        except Exception:
            pass

    model = _train_dummy_model()
    explainer = shap.TreeExplainer(model)
    return {
        "model": model,
        "explainer": explainer,
        "feature_names": FEATURES,
    }


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
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
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
    version="1.2.0",
    description="Fraud risk evaluation with SHAP-based explainability and model lifecycle support.",
    lifespan=lifespan,
)


@app.get("/health")
async def healthcheck() -> dict:
    return {
        "status": "ok",
        "model_loaded": "model" in ml_assets,
        "version": app.version,
    }


@app.post("/api/v1/analyze-transaction", response_model=AnalyzeTransactionResponse)
async def analyze_transaction(data: TransactionTelemetry):
    try:
        model = ml_assets["model"]
        explainer = ml_assets["explainer"]
        features = ml_assets["feature_names"]

        input_data = {feature: [getattr(data, feature)] for feature in features}
        input_df = pd.DataFrame(input_data)

        risk_proba = float(model.predict_proba(input_df)[0][1])
        impacts = _extract_feature_impacts(explainer, input_df)

        ordered_indices = np.argsort(impacts)[::-1]
        top_reasons: List[XaiDetail] = []

        for idx in ordered_indices:
            if impacts[idx] <= 0:
                continue
            feature_name = features[idx]
            top_reasons.append(
                XaiDetail(
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

        response = AnalyzeTransactionResponse(
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
