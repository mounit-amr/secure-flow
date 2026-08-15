from pydantic import BaseModel, Field
from typing import Optional

#  Base transaction payload submitted by the mobile app front-end
class TransactionRequest(BaseModel):
    user_id: str = Field(..., examples=["usr_98432"])
    amount: float = Field(..., gt=0.0, examples=[2500.50])
    recipient_account: str = Field(..., examples=["acc_mule_8821"])
    
    # Behavioral variables captured silently via client-side SDK
    typing_hesitation_ms: int = Field(0, description="Variance in ms between keystrokes")
    is_on_active_call: bool = Field(False, description="Is user on cellular or VoIP call?")
    screen_sharing_active: bool = Field(False, description="Is an app mirroring the screen?")
    
    # country geo location
    current_country: str = Field(..., min_length=2, max_length=2, examples=["IN"])

# Detailed payload format for objects stored within the Redis Quarantine cache
class QuarantinedTransaction(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    recipient_account: str
    timestamp: float


class EvaluateResponse(BaseModel):
    status: str = Field(..., description="APPROVED, CHALLENGE_REQUIRED, or QUARANTINED")
    action_required: Optional[str] = None
    reason: Optional[str] = None
    remaining_seconds: Optional[int] = None
