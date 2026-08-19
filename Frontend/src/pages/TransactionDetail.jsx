import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import { downloadFraudReport } from "../utils/generateReportPdf";

export default function TransactionDetail() {
  const { id } = useParams();
  const {
    transactions,
    updateTransactionStatus,
    addAlert,
    startFreezeFlow,
    user,
    accounts,
    getAccountPin,
  } = useApp();
  const navigate = useNavigate();
  const txn = transactions.find((t) => t.id === id);

  const [phase, setPhase] = useState("actions");
  const [actionModal, setActionModal] = useState(null);
  const [pin, setPin] = useState("");
  const [bioProgress, setBioProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!txn) {
    return (
      <div className="page-overlay">
        <Navbar variant="app" showBack />
        <div
          className="container"
          style={{ paddingTop: 40, textAlign: "center" }}
        >
          <p>Transaction not found.</p>
        </div>
      </div>
    );
  }

  const closeModal = () => {
    setActionModal(null);
    setPin("");
    setBioProgress(0);
    setLoading(false);
  };

  const finishAction = (status, title, message, type = "success") => {
    updateTransactionStatus(txn.id, status, status);
    addAlert({
      id: `act_${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
    });
    closeModal();
    setPhase("actions");
  };

  const handleYesItsMe = () => setPhase("verify");

  const handleCancelTxn = () => {
    setLoading(true);
    setTimeout(() => {
      finishAction(
        "cancelled",
        "Transaction Cancelled",
        "Transaction cancelled and funds held.",
        "medium",
      );
    }, 800);
  };

  const handleReportBank = () => {
    setLoading(true);
    setTimeout(() => {
      downloadFraudReport(txn, user);
      finishAction(
        "reported",
        "Reported to Bank",
        `Fraud PDF report downloaded. Case opened with ${txn.accountName}.`,
        "medium",
      );
    }, 700);
  };

  const startBiometric = () => {
    setActionModal("biometric");
    setBioProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 8;
      setBioProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(
          () =>
            finishAction(
              "confirmed",
              "Biometric Verified",
              "Identity confirmed. Transaction approved.",
            ),
          300,
        );
      }
    }, 80);
  };

  const handlePinVerify = (e) => {
    e.preventDefault();
    const relatedAccountId = txn.accountId || accounts?.[0]?.id || null;
    if (pin !== getAccountPin(relatedAccountId)) {
      addAlert({
        id: `pin_err_${Date.now()}`,
        type: "high",
        title: "Incorrect PIN",
        message: "Incorrect PIN.",
        timestamp: new Date().toISOString(),
      });
      setPin("");
      return;
    }
    setLoading(true);
    setTimeout(
      () =>
        finishAction(
          "confirmed",
          "PIN Verified",
          "Identity confirmed with PIN. Transaction approved.",
        ),
      600,
    );
  };

  const isLowRisk = txn.riskLevel === "low";
  const needsAction =
    ["flagged", "pending_verification"].includes(txn.status) ||
    (isLowRisk && txn.status === "completed" && !txn.userFeedback);
  // For low-risk completed, show optional verification
  const isOptionalVerify =
    isLowRisk && !["confirmed", "cancelled", "reported"].includes(txn.status);

  const isVerified = ["confirmed", "cancelled", "reported"].includes(
    txn.status,
  );

  const formatDateTime = (iso) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="page-overlay">
      <div
        style={{
          minHeight: "100vh",
          background: "transparent",
          paddingBottom: 100,
        }}
      >
        <Navbar variant="app" showBack />
        <div className="container" style={{ paddingTop: 28, maxWidth: 640 }}>
          <div className="card animate-in" style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 14,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  {txn.merchant}
                </h1>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--bg-elevated)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: "0.85rem",
                  }}
                >
                  🏦 <strong>{txn.accountName}</strong>
                </div>
              </div>
              <span className={`risk-badge risk-${txn.riskLevel}`}>
                {txn.riskLevel}
              </span>
            </div>

            <div
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: txn.amount > 0 ? "var(--success)" : "var(--text)",
                marginBottom: 14,
              }}
            >
              {txn.amount > 0 ? "+" : ""}
              {txn.amount.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                borderTop: "1px solid var(--border)",
                paddingTop: 14,
                fontSize: "0.85rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  Date & Time
                </div>
                <div style={{ fontWeight: 500 }}>
                  {formatDateTime(txn.date)}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  Location
                </div>
                <div style={{ fontWeight: 500 }}>
                  📍 {txn.location || "Unknown"}
                </div>
              </div>
              {txn.day && (
                <div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginBottom: 2,
                    }}
                  >
                    Day
                  </div>
                  <div style={{ fontWeight: 500 }}>{txn.day}</div>
                </div>
              )}
              {txn.fromName && (
                <div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginBottom: 2,
                    }}
                  >
                    From → To
                  </div>
                  <div style={{ fontWeight: 500 }}>
                    {txn.fromName} → {txn.toName}
                  </div>
                </div>
              )}
              <div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  Risk Score
                </div>
                <div style={{ fontWeight: 500 }}>{txn.riskScore}/100</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  Status
                </div>
                <div style={{ fontWeight: 500, textTransform: "capitalize" }}>
                  {txn.status.replace(/_/g, " ")}
                </div>
              </div>
            </div>
          </div>

          {txn.explainable && (
            <div
              className="card animate-in delay-1"
              style={{ marginBottom: 18, borderColor: "rgba(255,59,92,0.25)" }}
            >
              <h2
                style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}
              >
                🧠 Explainable AI Breakdown
              </h2>
              <p
                style={{
                  background: "var(--danger-dim)",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: "0.9rem",
                  marginBottom: 14,
                  fontWeight: 500,
                }}
              >
                {txn.explainable.summary}
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {txn.explainable.reasons.map((r, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span style={{ color: "var(--danger)" }}>•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isVerified && (
            <div
              className="card animate-in"
              style={{
                marginBottom: 18,
                borderColor: "rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(34,197,94,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--success)" }}>
                    Verified by you
                    {txn.status === "confirmed" && " · Confirmed"}
                    {txn.status === "cancelled" && " · Cancelled"}
                    {txn.status === "reported" && " · Reported to bank"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {txn.status === "confirmed" &&
                      "You confirmed this was a legitimate transaction"}
                    {txn.status === "cancelled" &&
                      "You cancelled this transaction"}
                    {txn.status === "reported" &&
                      "You filed a fraud report with the bank (PDF generated)"}
                    {txn.userFeedback === "confirmed" &&
                      txn.status === "confirmed" &&
                      " via identity check"}
                    {txn.verifiedAt && <> · {formatDateTime(txn.verifiedAt)}</>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {needsAction && phase === "actions" && (
            <div className="card animate-in delay-2">
              {isOptionalVerify ? (
                <>
                  <div
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--success)",
                        marginBottom: 4,
                        fontSize: "0.9rem",
                      }}
                    >
                      ✓ No verification required
                    </div>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.82rem",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      This transaction has a low AI risk score and looks normal.
                      You don’t need to verify it — but if something feels off,
                      you can still review and confirm or take action below.
                    </p>
                  </div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Optional review
                  </h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      marginBottom: 18,
                    }}
                  >
                    Only if you want extra peace of mind.
                  </p>
                </>
              ) : (
                <>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Was this you?
                  </h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      marginBottom: 18,
                    }}
                  >
                    This transaction needs your attention. Choose an action —
                    your response trains the model and can stop further damage.
                  </p>
                </>
              )}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <button className="btn btn-primary" onClick={handleYesItsMe}>
                  ✓ Yes, it’s me
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => setActionModal("cancel")}
                >
                  ✕ Cancel this transaction
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setActionModal("report")}
                >
                  📢 Report to bank (PDF)
                </button>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  <button
                    className="btn btn-outline"
                    style={{
                      borderColor: "rgba(255,59,92,0.4)",
                      color: "var(--danger)",
                      fontSize: "0.85rem",
                    }}
                    onClick={() => startFreezeFlow(txn.accountId)}
                  >
                    🔒 Freeze this account
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: "0.85rem" }}
                    onClick={() => startFreezeFlow("all")}
                  >
                    🔒 Freeze all accounts
                  </button>
                </div>
              </div>
            </div>
          )}

          {needsAction && phase === "verify" && (
            <div className="card animate-in">
              <h3
                style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}
              >
                Verify it’s you
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  marginBottom: 18,
                }}
              >
                Confirm your identity to mark this transaction as legitimate.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <button className="btn btn-primary" onClick={startBiometric}>
                  👆 Biometric verification
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setActionModal("pin")}
                >
                  🔢 Enter security PIN
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setPhase("actions")}
                >
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>

        {actionModal === "cancel" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  fontSize: "2.5rem",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                ⚠️
              </div>
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Cancel this transaction?
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                Reverse / hold{" "}
                {txn.amount.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}{" "}
                at {txn.merchant} from {txn.accountName}.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={closeModal}
                >
                  Go Back
                </button>
                <button
                  className="btn btn-warning"
                  style={{ flex: 1 }}
                  onClick={handleCancelTxn}
                  disabled={loading}
                >
                  {loading ? "Cancelling…" : "Yes, Cancel It"}
                </button>
              </div>
            </div>
          </div>
        )}

        {actionModal === "report" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  fontSize: "2.5rem",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                📢
              </div>
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Report to Bank
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                A detailed PDF with Explainable AI breakdown will be downloaded
                and a case opened with {txn.accountName}.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleReportBank}
                  disabled={loading}
                >
                  {loading ? "Generating…" : "Submit & Download PDF"}
                </button>
              </div>
            </div>
          </div>
        )}

        {actionModal === "biometric" && (
          <div className="modal-overlay">
            <div className="modal" style={{ textAlign: "center" }}>
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
                Place your finger or look at the camera…
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
                    transition: "width 0.08s linear",
                    borderRadius: 4,
                  }}
                />
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {bioProgress}%
              </p>
            </div>
          </div>
        )}

        {actionModal === "pin" && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Enter Security PIN
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  marginBottom: 18,
                }}
              >
                Enter your security PIN
              </p>
              <form onSubmit={handlePinVerify}>
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
                    marginBottom: 16,
                  }}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={loading || pin.length < 4}
                  >
                    {loading ? "Verifying…" : "Verify"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
