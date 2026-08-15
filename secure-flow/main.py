# import time
# import uuid
# from fastapi import FastAPI, Depends, Header,HTTPException, status
# from sqlalchemy.orm import session

import time
import uuid
from fastapi import FastAPI, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, redis_client
import models
import schemas

app = FastAPI(title="In-Flight Fraud Shield Engine")

@app.post(
    "/v1/payments/evaluate", 
    response_model=schemas.EvaluateResponse, 
    status_code=status.HTTP_200_OK
)
async def evaluate_payment(
    tx: schemas.TransactionRequest,
    x_device_fingerprint: str = Header(..., description="Hardware hash unique to device"),
    db: Session = Depends(get_db)
):
    current_time = time.time()
    
    # Fetch user account details from our persistent Postgres DB
    user = db.query(models.UserAccount).filter(models.UserAccount.user_id == tx.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    if user.is_frozen:
        raise HTTPException(status_code=403, detail="Account is strictly locked due to security anomalies.")

    # --- POLICY RISK LAYER 1: DEVICE FINGERPRINT ANOMALY ---
    if user.trusted_device_fingerprint and user.trusted_device_fingerprint != x_device_fingerprint:
        return schemas.EvaluateResponse(
            status="CHALLENGE_REQUIRED",
            action_required="STEP_UP_MFA",
            reason="Unrecognized hardware signature detected for high-value transfer."
        )

   # TRANSACTION VELOCITY (SLIDING WINDOW) 
    velocity_key = f"user:{tx.user_id}:tx_velocity"
    
    # Push the current attempt into the user's continuous Redis timeline
    redis_client.zadd(velocity_key, {f"{current_time}:{tx.recipient_account}": current_time})
    # Drop any historical actions that happened more than 10 minutes (600 seconds) ago
    redis_client.zremrangebyscore(velocity_key, "-inf", current_time - 600)
    

    recent_tx_count = redis_client.zcard(velocity_key)
    

    if recent_tx_count > 3 or (tx.is_on_active_call and tx.screen_sharing_active):
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        quarantine_key = f"quarantine:{tx_id}"
        
        # Build the exact data context we are intercepting
        quarantine_data = schemas.QuarantinedTransaction(
            transaction_id=tx_id,
            user_id=tx.user_id,
            amount=tx.amount,
            recipient_account=tx.recipient_account,
            timestamp=current_time
        )
        
        # Intercept funds: Lock the money locally inside Redis cache for 15 mins (900 seconds)
        redis_client.setex(quarantine_key, 900, quarantine_data.json())
        
        return schemas.EvaluateResponse(
            status="QUARANTINED",
            action_required="TRIGGER_SHIELD_UI",
            reason="High transaction velocity or severe coercion behaviors flagged.",
            remaining_seconds=900
        )

    # All criteria clear: Safe to dispatch to network settlement
    return schemas.EvaluateResponse(
        status="APPROVED",
        reason="Transaction metrics standard. Processing payload seamlessly."
    )


    
geo_history_key = f"user:{tx.user_id}:last_country"
last_country_data = redis_client.get(geo_history_key)
    
country_anomaly_triggered = False
    
if last_country_data:
    historical_record = json.loads(last_country_data)
        
        # Simple text match: Did the country change in less than 12 hours?
    if historical_record["country"] != tx.current_country:
        time_diff_hours = (current_time - historical_record["timestamp"]) / 3600.0
        if time_diff_hours < 12.0:
            country_anomaly_triggered = True

    # Cache current country for the next check
redis_client.set(geo_history_key, json.dumps({
    "country": tx.current_country,
    "timestamp": current_time
}))
