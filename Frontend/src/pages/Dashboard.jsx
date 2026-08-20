import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      const targets = document.querySelectorAll(".ripple-target");
      targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--rx", `${e.clientX - rect.left}px`);
        target.style.setProperty("--ry", `${e.clientY - rect.top}px`);
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const recent = transactions.slice(0, 6);
  const flaggedCount = transactions.filter(
    (t) =>
      t.riskLevel === "high" ||
      t.riskLevel === "critical" ||
      t.status === "flagged" ||
      t.status === "pending_verification",
  ).length;

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
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Background Layer with radar dot grid & blurred ambient glows */}
      <div className="bg-layer">
        <div className="bg-glow one" />
        <div className="bg-glow two" />
        <div className="bg-glow three" />
      </div>

      <Navbar variant="app" />

      <main>
        {/* Top Greeting Row */}
        <div className="top-row">
          <div>
            <h1 className="hello display">Hello, {user?.name?.split(" ")[0] || "there"}</h1>
            <p className="sub">
              {isGlobalFrozen
                ? "All accounts are currently frozen."
                : "Your accounts are being monitored in real time."}
            </p>
          </div>
          <button
            className={`freeze-btn ripple-target on-dark ${isGlobalFrozen ? "freeze-btn-frozen" : ""}`}
            onClick={handleFreezeToggle}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z"
                fill="#fff"
              />
            </svg>
            {isGlobalFrozen ? "Unfreeze Accounts" : "One-Tap Freeze"}
          </button>
        </div>

        {/* Balance Card */}
        <div className="balance-card ripple-target on-dark">
          <div className="ring-deco" />
          <div>
            <div className="balance-label">SecureFlow balance</div>
            <div className="balance-amount mono">
              ₹
              {(user?.balance ?? 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <Link
            to="/pay"
            className="send-btn ripple-target on-dark"
            onClick={handleSendClick}
            style={{ textDecoration: "none" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 11l18-8-8 18-2-8-8-2z" fill="#fff" />
            </svg>
            Send
          </Link>
        </div>

        {/* Stat Cards Grid */}
        <div className="stat-grid">
          {/* Account Health */}
          <div className="stat-card health ripple-target">
            <div className="stat-label">Account Health</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div className={`stat-value ${
                  healthScore <= 40 ? "health-low" : healthScore <= 69 ? "health-mid" : "health-high"
                }`}>{healthScore}</div>
                <div className="stat-sub">
                  {healthScore >= 70 ? "Strong" : healthScore >= 41 ? "Fair" : "At risk"}
                </div>
              </div>
              <div className="ring-wrap">
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle className="ring-bg" cx="22" cy="22" r="18" fill="none" strokeWidth="4" />
                  <circle
                    className={`ring-fg ${
                      healthScore <= 40 ? "health-low" : healthScore <= 69 ? "health-mid" : "health-high"
                    }`}
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    strokeWidth="4"
                    strokeDasharray="113.1"
                    strokeDashoffset={113.1 * (1 - healthScore / 100)}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Linked Accounts */}
          <div className="stat-card linked ripple-target">
            <div className="stat-label">Linked Accounts</div>
            <div className="stat-value">{accounts.length}</div>
            <div className="stat-sub">{accounts.filter((a) => a.status === "frozen").length} frozen</div>
          </div>

          {/* Needs Review */}
          <div className="stat-card review ripple-target">
            <div className="stat-label">Needs Review</div>
            <div className={`stat-value ${flaggedCount ? "" : "green"}`}>{flaggedCount}</div>
            <div className="stat-sub">High / Critical</div>
          </div>

          {/* Status */}
          <div className="stat-card status ripple-target">
            <div className="stat-label">Status</div>
            <div className="status-pill">
              <span className="dot" />
              {isGlobalFrozen ? "FROZEN" : "ACTIVE"}
            </div>
            <div className="stat-sub" style={{ marginTop: 6 }}>
              {isGlobalFrozen ? "Emergency lock" : "Monitoring live"}
            </div>
          </div>
        </div>

        {/* Linked Accounts Section */}
        <div className="section-head">
          <h2>Linked Accounts</h2>
          <Link to="/accounts">Manage →</Link>
        </div>
        <div className="panel">
          {accounts.map((acc) => (
            <div key={acc.id} className="account-row ripple-target">
              <div className="row-left">
                <div className="icon-badge card">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2.5" fill="#fff" fillOpacity="0.9" />
                    <rect x="2" y="9" width="20" height="3" fill="#0F1B3D" />
                  </svg>
                </div>
                <div>
                  <div className="acc-title">{acc.name}</div>
                  <div className="acc-sub">•••• {acc.last4}</div>
                </div>
              </div>
              <span className={`badge ${acc.status === "frozen" ? "risk-critical" : "active"}`}>
                {acc.status === "frozen" ? "FROZEN" : "ACTIVE"}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Transactions Section */}
        <div className="section-head">
          <h2>Recent Transactions</h2>
          <Link to="/history">View all →</Link>
        </div>
        <div className="panel">
          {recent.map((txn) => {
            const verified = ["confirmed", "cancelled", "reported"].includes(txn.status);
            const low = !needsVerify(txn);
            return (
              <Link
                key={txn.id}
                to={`/transaction/${txn.id}`}
                className="txn-row ripple-target"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="row-left">
                  <div className="icon-badge txn-out">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 19V5M5 12l7-7 7 7"
                        stroke="#B54708"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="txn-title-row">
                      <span className="txn-title">{txn.merchant}</span>
                      {verified && (
                        <span className="badge verify">
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
                      {!verified && low && <span className="badge verify">NO VERIFY NEEDED</span>}
                      {!verified && !low && (
                        <span
                          className="badge"
                          style={{ background: "rgba(247,144,9,0.15)", color: "var(--amber)" }}
                        >
                          NEEDS VERIFY
                        </span>
                      )}
                    </div>
                    <div className="txn-meta">
                      {txn.accountName} <span className="sep">·</span>
                      {txn.fromName && txn.toName && (
                        <>
                          {txn.fromName} → {txn.toName} <span className="sep">·</span>
                        </>
                      )}
                      {txn.day || formatDT(txn.date)} <span className="sep">·</span>
                      {formatDT(txn.date)} <span className="sep">·</span>
                      📍 {txn.location || "Location not available"}
                    </div>
                  </div>
                </div>
                <div className="txn-right">
                  <span
                    className="txn-amount"
                    style={{ color: txn.amount > 0 ? "var(--green)" : "#B42318" }}
                  >
                    {txn.amount > 0 ? "+" : ""}
                    {txn.amount.toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                    })}
                  </span>
                  <span className={`badge ${txn.riskLevel === "low" ? "low" : ""}`}>
                    {txn.riskLevel.toUpperCase()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* High Risk Simulation Button */}
        <div style={{ marginTop: 36, display: "flex", justifyContent: "center" }}>
          <button
            className="ripple-target"
            onClick={simulateHighRisk}
            style={{
              padding: "16px 32px",
              borderRadius: 16,
              border: "1px solid rgba(255,59,92,0.35)",
              background: "linear-gradient(135deg, rgba(255,45,85,0.15), rgba(255,94,58,0.08))",
              color: "var(--ink)",
              fontWeight: 700,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 8px 32px rgba(255,45,85,0.15)",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "var(--amber)",
                boxShadow: "0 0 10px var(--amber)",
                animation: "livedot 1.5s ease-in-out infinite",
              }}
            />
            Simulate High-Risk Alert
            <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: "0.8rem" }}>
              → opens critical txn
            </span>
          </button>
        </div>
      </main>

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
