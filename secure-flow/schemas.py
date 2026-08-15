from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TransactionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str = Field(..., examples=["usr_98432"])
    amount: float = Field(..., gt=0.0, examples=[2500.5])
    recipient_account: str = Field(..., examples=["acc_mule_8821"])
    typing_hesitation_ms: int = Field(0, description="Variance in ms between keystrokes")
    is_on_active_call: bool = Field(False, description="Is user on cellular or VoIP call?")
    screen_sharing_active: bool = Field(False, description="Is an app mirroring the screen?")


class QuarantinedTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")

    transaction_id: str
    user_id: str
    amount: float
    recipient_account: str
    timestamp: float


class EvaluateResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: str = Field(..., description="APPROVED, CHALLENGE_REQUIRED, or QUARANTINED")
    action_required: Optional[str] = None
    reason: Optional[str] = None
    remaining_seconds: Optional[int] = None


class TransactionTelemetry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    transaction_id: str = Field(..., min_length=1)
    velocity_1h: float = Field(..., ge=0.0)
    new_beneficiary: int = Field(..., ge=0, le=1)
    location_distance_km: float = Field(..., ge=0.0)
    typing_cadence_variance: float = Field(..., ge=0.0)
    active_screenshare: int = Field(..., ge=0, le=1)


class XaiDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")

    feature: str
    reason: str
    shap_value: float


class AnalyzeTransactionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    transaction_id: str
    risk_score: float
    risk_tier: str
    action_required: str
    xai_summary: str
    xai_details: List[XaiDetail]
    model_version: str
