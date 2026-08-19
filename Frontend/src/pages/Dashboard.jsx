import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import AuthVerifyModal from "../components/AuthVerifyModal";

export default function Dashboard() {
  const {
    user,
    accounts,
    transactions,
    healthScore,
    isGlobalFrozen,
    startFreezeFlow,
    unfreezeAll,
    addAlert,
    getAccountPin,
    isUserFrozen,
  } = useApp();
  const navigate = useNavigate();
  const [showUnfreezeAuth, setShowUnfreezeAuth] = useState(false);

  const recent = transactions.slice(0, 6);
  const flaggedCount = transactions.filter(
    (t) =>
      t.riskLevel === "high" ||
      t.riskLevel === "critical" ||
      t.status === "flagged" ||
      t.status === "pending_verification",
  ).length;

  const healthColor =
    healthScore >= 80
      ? "var(--success)"
      : healthScore >= 50
        ? "var(--warning)"
        : "var(--danger)";

  const formatDT = (iso) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const needsVerify = (txn) => txn.riskLevel !== "low";

  const simulateHighRisk = () => {
    const critical = transactions.find(
      (t) => t.riskLevel === "critical" || t.riskLevel === "high",
    );
    addAlert({
      id: `demo_${Date.now()}`,
      type: "high",
      title: "Suspicious Transaction Detected",
      message: critical
        ? `${critical.merchant} · ${critical.accountName}. Review now.`
        : "High-risk activity detected. Review now.",
      timestamp: new Date().toISOString(),
    });
    if (critical)
      setTimeout(() => navigate(`/transaction/${critical.id}`), 600);
  };

  const handleFreezeToggle = () => {
    if (isGlobalFrozen) {
      setShowUnfreezeAuth(true);
    } else {
      startFreezeFlow("all");
    }
  };

  const handleSendClick = (event) => {
    if (isGlobalFrozen || isUserFrozen(user?.id)) {
      event.preventDefault();
      addAlert({
        id: `frozen_send_${Date.now()}`,
        type: "high",
        title: "Account is frozen",
        message:
          "You cannot send or receive money while this account is frozen.",
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        paddingBottom: 60,
      }}
    >
      <Navbar variant="app" />

      <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 4 }}
            >
              Hello, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              {isGlobalFrozen
                ? "All accounts are currently frozen."
                : "Your accounts are being monitored in real time."}
            </p>
          </div>

          <button
            className={`freeze-btn ${isGlobalFrozen ? "freeze-btn-frozen" : "freeze-btn-active"}`}
            onClick={handleFreezeToggle}
          >
            <span style={{ fontSize: "1.15rem" }}>
              {isGlobalFrozen ? "🔓" : "🔒"}
            </span>
            {isGlobalFrozen ? "Unfreeze Accounts" : "One-Tap Freeze"}
          </button>
        </div>

        {/* Wallet */}
        <div
          className="card"
          style={{
            marginBottom: 20,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              SecureFlow balance
            </div>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: 800,
                color: "var(--accent)",
              }}
            >
              ₹
              {(user?.balance ?? 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {user?.upiId}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              to="/pay"
              className="btn btn-primary"
              onClick={handleSendClick}
            >
              💸 Send
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            {
              label: "Account Health",
              value: healthScore,
              sub:
                healthScore >= 80
                  ? "Strong"
                  : healthScore >= 50
                    ? "Needs attention"
                    : "At risk",
              color: healthColor,
            },
            {
              label: "Linked Accounts",
              value: accounts.length,
              sub: `${accounts.filter((a) => a.status === "frozen").length} frozen`,
              color: "var(--text)",
            },
            {
              label: "Needs Review",
              value: flaggedCount,
              sub: "High / Critical",
              color: flaggedCount ? "var(--danger)" : "var(--success)",
            },
            {
              label: "Status",
              value: isGlobalFrozen ? "FROZEN" : "ACTIVE",
              sub: isGlobalFrozen ? "Emergency lock" : "Monitoring live",
              color: isGlobalFrozen ? "var(--danger)" : "var(--success)",
            },
          ].map((c) => (
            <div key={c.label} className="card">
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: 6,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontSize: typeof c.value === "number" ? "2rem" : "1.3rem",
                  fontWeight: 800,
                  color: c.color,
                }}
              >
                {c.value}
              </div>
              <div
                style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
              >
                {c.sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              Linked Accounts
            </h2>
            <Link
              to="/accounts"
              style={{ color: "var(--accent)", fontSize: "0.9rem" }}
            >
              Manage →
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  borderColor:
                    acc.status === "frozen"
                      ? "rgba(255,59,92,0.3)"
                      : "var(--border)",
                }}
              >
                <div style={{ fontSize: "1.6rem" }}>{acc.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {acc.name}
                  </div>
                  <div
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    •••• {acc.last4}
                  </div>
                </div>
                <span
                  className={`risk-badge ${acc.status === "frozen" ? "risk-critical" : "risk-low"}`}
                >
                  {acc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              Recent Transactions
            </h2>
            <Link
              to="/history"
              style={{ color: "var(--accent)", fontSize: "0.9rem" }}
            >
              View all →
            </Link>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {recent.map((txn, i) => {
              const verified = ["confirmed", "cancelled", "reported"].includes(
                txn.status,
              );
              const low = !needsVerify(txn);
              return (
                <Link
                  key={txn.id}
                  to={`/transaction/${txn.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderBottom:
                      i < recent.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--bg-elevated)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                    }}
                  >
                    {txn.amount > 0 ? "↓" : "↑"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                        {txn.merchant}
                      </span>
                      {verified && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 6,
                            background: "rgba(34,197,94,0.15)",
                            color: "var(--success)",
                          }}
                        >
                          ✓{" "}
                          {txn.status === "confirmed"
                            ? "CONFIRMED"
                            : txn.status === "cancelled"
                              ? "CANCELLED"
                              : txn.status === "reported"
                                ? "REPORTED"
                                : "VERIFIED"}
                        </span>
                      )}
                      {!verified && low && (
                        <span className="badge-no-verify">
                          NO VERIFY NEEDED
                        </span>
                      )}
                      {!verified && !low && (
                        <span className="badge-verify-needed">
                          NEEDS VERIFY
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        marginTop: 3,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "2px 10px",
                      }}
                    >
                      <span>🏦 {txn.accountName}</span>
                      {txn.fromName && txn.toName && (
                        <span>
                          · {txn.fromName} → {txn.toName}
                        </span>
                      )}
                      <span>· {txn.day || formatDT(txn.date)}</span>
                      <span>· {formatDT(txn.date)}</span>
                      <span>· 📍 {txn.location || "—"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color:
                          txn.amount > 0 ? "var(--success)" : "var(--text)",
                      }}
                    >
                      {txn.amount > 0 ? "+" : ""}
                      {txn.amount.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                      })}
                    </div>
                    <span className={`risk-badge risk-${txn.riskLevel}`}>
                      {txn.riskLevel}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div
          style={{ marginTop: 36, display: "flex", justifyContent: "center" }}
        >
          <button
            onClick={simulateHighRisk}
            style={{
              padding: "16px 32px",
              borderRadius: 16,
              border: "1px solid rgba(255,59,92,0.35)",
              background:
                "linear-gradient(135deg, rgba(255,45,85,0.15), rgba(255,94,58,0.08))",
              color: "var(--text)",
              fontWeight: 700,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 8px 32px rgba(255,45,85,0.15)",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(255,45,85,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow =
                "0 8px 32px rgba(255,45,85,0.15)";
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "var(--danger)",
                boxShadow: "0 0 10px var(--danger)",
                animation: "fabPulse 1.5s ease-in-out infinite",
              }}
            />
            Simulate High-Risk Alert
            <span
              style={{
                color: "var(--text-muted)",
                fontWeight: 500,
                fontSize: "0.8rem",
              }}
            >
              → opens critical txn
            </span>
          </button>
        </div>
      </div>

      <AuthVerifyModal
        open={showUnfreezeAuth}
        title="Verify to Unfreeze"
        subtitle="Confirm your identity to reactivate all accounts"
        expectedPin={getAccountPin(accounts?.[0]?.id)}
        onSuccess={() => {
          unfreezeAll();
          setShowUnfreezeAuth(false);
        }}
        onCancel={() => setShowUnfreezeAuth(false)}
      />
    </div>
  );
}
