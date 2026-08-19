import { useState } from "react";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import AuthVerifyModal from "../components/AuthVerifyModal";

const ACCOUNT_TYPES = [
  {
    id: "Bank",
    label: "Bank Account",
    icon: "🏦",
    placeholder: "Account number (e.g. 123456789012)",
  },
  {
    id: "UPI",
    label: "UPI / Payment App",
    icon: "📱",
    placeholder: "UPI ID (e.g. name@okaxis)",
  },
  {
    id: "Crypto",
    label: "Crypto Wallet",
    icon: "₿",
    placeholder: "Wallet address or last 4",
  },
  {
    id: "Wallet",
    label: "Digital Wallet",
    icon: "💳",
    placeholder: "Wallet ID / last 4 digits",
  },
];

export default function Accounts() {
  const { accounts, unfreezeAccount, setAccounts, addAlert, getAccountPin } =
    useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: "Bank",
    name: "",
    accountNumber: "",
    otp: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authAction, setAuthAction] = useState(null);

  const resetAdd = () => {
    setShowAdd(false);
    setStep(1);
    setForm({ type: "Bank", name: "", accountNumber: "", otp: "" });
    setError("");
    setLoading(false);
  };

  const handleTypeNext = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter a display name for this account");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleAccountNext = (e) => {
    e.preventDefault();
    if (!form.accountNumber.trim() || form.accountNumber.length < 4) {
      setError("Please enter a valid account number / UPI ID");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 900);
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    if (form.otp !== "123456") {
      setError("Invalid OTP");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const last4 = form.accountNumber.slice(-4);
      const icon = ACCOUNT_TYPES.find((t) => t.id === form.type)?.icon || "🏦";
      const acc = {
        id: `acc_${Date.now()}`,
        name: form.name,
        type: form.type,
        last4,
        balance: 0,
        status: "active",
        icon,
        accountNumber: form.accountNumber,
        securityPin: "1234",
      };
      setAccounts((prev) => [...prev, acc]);
      addAlert({
        id: `add_${Date.now()}`,
        type: "success",
        title: "Account Linked Successfully",
        message: `${acc.name} is now protected by SecureFlow.`,
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
      resetAdd();
    }, 700);
  };

  const requestUnfreeze = (id, name) =>
    setAuthAction({ type: "unfreeze", id, name });
  const requestRemove = (id, name) =>
    setAuthAction({ type: "remove", id, name });

  const onAuthSuccess = () => {
    if (!authAction) return;
    if (authAction.type === "unfreeze") {
      unfreezeAccount(authAction.id);
      addAlert({
        id: `uf_${Date.now()}`,
        type: "success",
        title: "Account Reactivated",
        message: `${authAction.name} is active again.`,
        timestamp: new Date().toISOString(),
      });
    } else if (authAction.type === "remove") {
      setAccounts((prev) => prev.filter((a) => a.id !== authAction.id));
      addAlert({
        id: `rm_${Date.now()}`,
        type: "medium",
        title: "Account Removed",
        message: `${authAction.name} is no longer monitored.`,
        timestamp: new Date().toISOString(),
      });
    }
    setAuthAction(null);
  };

  const typeInfo = ACCOUNT_TYPES.find((t) => t.id === form.type);

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
        <div className="container" style={{ paddingTop: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                Linked Accounts
              </h1>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  marginTop: 4,
                }}
              >
                Banks, UPI, wallets & crypto under one control plane
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowAdd(true)}
            >
              + Link Account
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 24,
              marginTop: 16,
            }}
          >
            {ACCOUNT_TYPES.map((t) => (
              <span
                key={t.id}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: "0.8rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {t.icon} {t.label}
              </span>
            ))}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
            className="stagger"
          >
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="card animate-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  borderColor:
                    acc.status === "frozen"
                      ? "rgba(224,90,122,0.4)"
                      : "var(--border)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                  }}
                >
                  {acc.icon}
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700 }}>{acc.name}</div>
                  <div
                    style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                  >
                    {acc.type} · •••• {acc.last4}
                    {acc.balance > 0 &&
                      ` · ₹${acc.balance.toLocaleString("en-IN")}`}
                  </div>
                </div>
                <span
                  className={`risk-badge ${acc.status === "frozen" ? "risk-critical" : "risk-low"}`}
                >
                  {acc.status}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  {acc.status === "frozen" && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => requestUnfreeze(acc.id, acc.name)}
                    >
                      Unfreeze
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => requestRemove(acc.id, acc.name)}
                    style={{ color: "var(--danger)" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div
                className="card"
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "var(--text-muted)",
                }}
              >
                No accounts linked yet. Click “+ Link Account” to get started.
              </div>
            )}
          </div>
        </div>

        <AuthVerifyModal
          open={!!authAction}
          title={
            authAction?.type === "remove"
              ? "Verify to Remove Account"
              : "Verify to Reactivate"
          }
          subtitle={
            authAction?.type === "remove"
              ? `Confirm identity to remove ${authAction?.name}`
              : `Confirm identity to unfreeze ${authAction?.name}`
          }
          expectedPin={getAccountPin(authAction?.id)}
          onSuccess={onAuthSuccess}
          onCancel={() => setAuthAction(null)}
        />

        {showAdd && (
          <div className="modal-overlay" onClick={resetAdd}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 460 }}
            >
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: step >= s ? "var(--accent)" : "var(--border)",
                      transition: "background 0.3s",
                    }}
                  />
                ))}
              </div>

              {step === 1 && (
                <form onSubmit={handleTypeNext}>
                  <h2
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Link a new account
                  </h2>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      marginBottom: 18,
                    }}
                  >
                    Choose type and give it a name you’ll recognize.
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.id })}
                        style={{
                          padding: "14px 10px",
                          borderRadius: 12,
                          textAlign: "center",
                          border:
                            form.type === t.id
                              ? "1.5px solid var(--accent)"
                              : "1.5px solid var(--border)",
                          background:
                            form.type === t.id
                              ? "var(--accent-dim)"
                              : "var(--bg)",
                          transition: "all 0.2s",
                          color: "var(--text)",
                        }}
                      >
                        <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>
                          {t.icon}
                        </div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          {t.label}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      className="form-input"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g. HDFC Salary Account"
                      autoFocus
                    />
                  </div>
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
                      onClick={resetAdd}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      Next
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleAccountNext}>
                  <h2
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    {typeInfo?.icon} Enter{" "}
                    {form.type === "UPI" ? "UPI ID" : "Account Number"}
                  </h2>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      marginBottom: 18,
                    }}
                  >
                    We’ll send an OTP to verify ownership of{" "}
                    <strong>{form.name}</strong>.
                  </p>
                  <div className="form-group">
                    <label>
                      {form.type === "UPI" ? "UPI ID" : "Account / Card Number"}
                    </label>
                    <input
                      className="form-input"
                      value={form.accountNumber}
                      onChange={(e) =>
                        setForm({ ...form, accountNumber: e.target.value })
                      }
                      placeholder={typeInfo?.placeholder}
                      autoFocus
                    />
                  </div>
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
                      onClick={() => setStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={loading}
                    >
                      {loading ? "Sending OTP…" : "Send OTP"}
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleOtpVerify}>
                  <h2
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Verify with OTP
                  </h2>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      marginBottom: 18,
                    }}
                  >
                    OTP sent for <strong>{form.name}</strong> (••••
                    {form.accountNumber.slice(-4)}). Enter the OTP sent to you.
                  </p>
                  <div className="form-group">
                    <label>6-digit OTP</label>
                    <input
                      className="form-input"
                      value={form.otp}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          otp: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      style={{
                        letterSpacing: "0.3em",
                        fontSize: "1.25rem",
                        textAlign: "center",
                      }}
                      autoFocus
                    />
                  </div>
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
                      onClick={() => setStep(2)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={loading}
                    >
                      {loading ? "Verifying…" : "Verify & Link"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
