import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function FreezeConfirm() {
  const {
    showFreezeConfirm,
    freezeCountdown,
    confirmFreeze,
    cancelFreeze,
    freezeTarget,
    accounts,
    getAccountPin,
  } = useApp();
  const expectedPin = getAccountPin(
    freezeTarget !== "all" ? freezeTarget : accounts?.[0]?.id,
  );

  const [step, setStep] = useState("confirm"); // confirm | biometric | pin
  const [bioProgress, setBioProgress] = useState(0);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (showFreezeConfirm) {
      setStep("confirm");
      setBioProgress(0);
      setPin("");
      setError("");
    }
  }, [showFreezeConfirm]);

  if (!showFreezeConfirm) return null;

  const mins = Math.floor((freezeCountdown || 0) / 60);
  const secs = (freezeCountdown || 0) % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const isSingle = freezeTarget !== "all";
  const accName = isSingle
    ? accounts.find((a) => a.id === freezeTarget)?.name
    : null;

  const startBio = () => {
    setStep("biometric");
    setBioProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setBioProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep("pin"), 250);
      }
    }, 70);
  };

  const handlePin = (e) => {
    e.preventDefault();
    if (pin !== expectedPin) {
      setError("Incorrect PIN");
      setPin("");
      return;
    }
    confirmFreeze();
  };

  return (
    <div className="modal-overlay">
      <div className="modal animate-in" style={{ textAlign: "center" }}>
        {step === "confirm" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🚨</div>
            <h2
              style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: 8 }}
            >
              {isSingle ? "Freeze This Account?" : "Confirm Emergency Freeze"}
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: 20,
                fontSize: "0.95rem",
              }}
            >
              {isSingle
                ? `This will lock only ${accName || "this account"}. Other linked accounts stay active.`
                : "This will instantly lock ALL linked bank accounts, UPI apps, and wallets."}
            </p>
            <div
              style={{
                background: "var(--danger-dim)",
                border: "1px solid rgba(255,59,92,0.3)",
                borderRadius: 12,
                padding: "16px",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Action window
              </div>
              <div
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  color: "var(--danger)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {timeStr}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                remaining
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn btn-outline"
                onClick={cancelFreeze}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={startBio}
                style={{ flex: 1 }}
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {step === "biometric" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>👆</div>
            <h2
              style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}
            >
              Biometric Verification
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginBottom: 20,
              }}
            >
              Confirm your identity before freezing
            </p>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "var(--bg-elevated)",
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${bioProgress}%`,
                  background: "var(--accent)",
                  transition: "width 0.07s linear",
                  borderRadius: 4,
                }}
              />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {bioProgress}%
            </p>
          </>
        )}

        {step === "pin" && (
          <>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔢</div>
            <h2
              style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}
            >
              Enter Security PIN
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                marginBottom: 16,
              }}
            >
              Enter your security PIN
            </p>
            <form onSubmit={handlePin}>
              <input
                className="form-input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                style={{
                  letterSpacing: "0.4em",
                  fontSize: "1.4rem",
                  textAlign: "center",
                  marginBottom: 12,
                }}
                autoFocus
              />
              {error && (
                <p
                  style={{
                    color: "var(--danger)",
                    fontSize: "0.85rem",
                    marginBottom: 10,
                  }}
                >
                  {error}
                </p>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={cancelFreeze}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={pin.length < 4}
                >
                  Freeze Now
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
