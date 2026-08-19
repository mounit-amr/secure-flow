import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Settings() {
  const {
    settings,
    setSettings,
    user,
    accounts,
    updateUser,
    addAlert,
    getAccountPin,
    updateAccountPin,
  } = useApp();
  const navigate = useNavigate();
  const [editField, setEditField] = useState(null); // name | email | phone | null
  const [editValue, setEditValue] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinChangedMsg, setPinChangedMsg] = useState(false);

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setSensitivity = (val) => {
    setSettings((prev) => ({ ...prev, riskSensitivity: val }));
  };

  const setToastDuration = (val) => {
    setSettings((prev) => ({ ...prev, toastDuration: Number(val) }));
  };

  const startEdit = (field) => {
    setEditField(field);
    if (field === "email") setEditValue(user?.email || "");
    else if (field === "phone") setEditValue(user?.phone || "");
    else if (field === "name") setEditValue(user?.name || "");
    setOtpStep(false);
    setOtp("");
    setError("");
  };

  const handleNameSave = (e) => {
    e.preventDefault();
    if (!editValue.trim()) {
      setError("Name cannot be empty");
      return;
    }
    updateUser({ name: editValue.trim() });
    addAlert({
      id: `name_${Date.now()}`,
      type: "success",
      title: "Name Updated",
      message: `Display name changed to ${editValue.trim()}.`,
      timestamp: new Date().toISOString(),
    });
    setEditField(null);
  };

  const handlePinChange = (e) => {
    e.preventDefault();
    setPinError("");
    const primaryAccount = accounts?.[0];
    const current = getAccountPin(primaryAccount?.id);
    if (oldPin !== current) {
      setPinError("Current PIN is incorrect");
      return;
    }
    if (newPin.length < 4) {
      setPinError("New PIN must be at least 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("New PINs do not match");
      return;
    }
    if (primaryAccount) updateAccountPin(primaryAccount.id, newPin);
    addAlert({
      id: `pin_${Date.now()}`,
      type: "success",
      title: "PIN changed successfully",
      message: "Your security PIN has been updated for the selected account.",
      timestamp: new Date().toISOString(),
    });
    setShowPinChange(false);
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    // Inline confirmation on the form area
    setPinChangedMsg(true);
    setTimeout(() => setPinChangedMsg(false), 4000);
  };

  const sendOtpForEdit = (e) => {
    e.preventDefault();
    if (!editValue.trim()) {
      setError("Please enter a value");
      return;
    }
    setOtpStep(true);
    setError("");
  };

  const confirmEdit = (e) => {
    e.preventDefault();
    if (otp !== "123456") {
      setError("Invalid OTP");
      return;
    }
    if (editField === "email") updateUser({ email: editValue });
    else updateUser({ phone: editValue });
    addAlert({
      id: `prof_${Date.now()}`,
      type: "success",
      title: "Profile Updated",
      message: `${editField === "email" ? "Email" : "Phone"} changed successfully.`,
      timestamp: new Date().toISOString(),
    });
    setEditField(null);
    setOtpStep(false);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        overflowY: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
        {/* Back button OUTSIDE the settings box */}
        <div style={{ width: "100%", marginBottom: 12, padding: "0 4px" }}>
          <button
            className="back-btn"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div
          className="modal animate-in"
          style={{
            maxWidth: 640,
            width: "100%",
            marginBottom: 24,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h1
            style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: 24 }}
          >
            Settings
          </h1>

          {/* Profile */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={sectionLabel}>Profile</h2>
            <div
              style={{ background: "var(--bg)", borderRadius: 12, padding: 16 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Name
                  </div>
                  <div style={{ fontWeight: 600 }}>{user?.name}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => startEdit("name")}
                >
                  Edit
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Email
                  </div>
                  <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                    {user?.email}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => startEdit("email")}
                >
                  Edit
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Phone
                  </div>
                  <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                    {user?.phone || "—"}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => startEdit("phone")}
                >
                  Edit
                </button>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={sectionLabel}>Appearance</h2>
            <div
              style={{ background: "var(--bg)", borderRadius: 12, padding: 16 }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  marginBottom: 12,
                }}
              >
                Theme
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className={`btn ${settings.theme === "dark" ? "btn-primary" : "btn-outline"} btn-sm`}
                  style={{ flex: 1 }}
                  onClick={() => setSettings((s) => ({ ...s, theme: "dark" }))}
                >
                  🌙 Dark
                </button>
                <button
                  type="button"
                  className={`btn ${settings.theme === "light" ? "btn-primary" : "btn-outline"} btn-sm`}
                  style={{ flex: 1 }}
                  onClick={() => setSettings((s) => ({ ...s, theme: "light" }))}
                >
                  ☀️ Light
                </button>
              </div>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  marginTop: 10,
                }}
              >
                Your choice is saved automatically until you change it.
              </p>
            </div>
          </section>

          {/* Notifications */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={sectionLabel}>Notifications</h2>
            <div
              style={{ background: "var(--bg)", borderRadius: 12, padding: 16 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    Push alerts
                  </div>
                  <div
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    Medium & high risk events
                  </div>
                </div>
                <Toggle
                  on={settings.notifications}
                  onClick={() => toggle("notifications")}
                />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    marginBottom: 8,
                  }}
                >
                  Toast duration: {settings.toastDuration}s
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={settings.toastDuration}
                  onChange={(e) => setToastDuration(e.target.value)}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>5s</span>
                  <span>30s</span>
                </div>
              </div>
            </div>
          </section>

          {/* Monitoring */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={sectionLabel}>What we monitor</h2>
            <div
              style={{
                background: "var(--bg)",
                borderRadius: 12,
                padding: "4px 16px",
              }}
            >
              {[
                {
                  key: "monitorTyping",
                  label: "Typing cadence",
                  desc: "Detects unusual input patterns",
                },
                {
                  key: "monitorNavigation",
                  label: "Navigation speed",
                  desc: "Flags abnormal behavior",
                },
                {
                  key: "monitorDevice",
                  label: "Device fingerprint",
                  desc: "Recognizes trusted devices",
                },
                {
                  key: "biometricEnabled",
                  label: "Biometric re-auth",
                  desc: "Fingerprint / face for step-up",
                },
              ].map((item, i, arr) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom:
                      i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {item.label}
                    </div>
                    <div
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      {item.desc}
                    </div>
                  </div>
                  <Toggle
                    on={settings[item.key]}
                    onClick={() => toggle(item.key)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Risk sensitivity */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={sectionLabel}>Risk sensitivity</h2>
            <div style={{ display: "flex", gap: 8 }}>
              {["low", "balanced", "high"].map((level) => (
                <button
                  key={level}
                  className={`btn ${settings.riskSensitivity === level ? "btn-primary" : "btn-outline"} btn-sm`}
                  onClick={() => setSensitivity(level)}
                  style={{ flex: 1, textTransform: "capitalize" }}
                >
                  {level}
                </button>
              ))}
            </div>
          </section>

          {/* Security PIN */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={sectionLabel}>Security</h2>
            <button
              className="btn btn-outline"
              style={{ width: "100%", justifyContent: "space-between" }}
              onClick={() => {
                setShowPinChange(!showPinChange);
                setPinError("");
                setOldPin("");
                setNewPin("");
                setConfirmPin("");
              }}
            >
              <span>🔢 Change Security PIN</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {showPinChange ? "▲" : "▼"}
              </span>
            </button>
            {pinChangedMsg && (
              <div
                className="animate-in"
                style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--calm-green-tint)",
                  border: "1px solid var(--calm-green)",
                  color: "var(--calm-green)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                ✓ Your PIN was changed successfully
              </div>
            )}
            {showPinChange && (
              <form
                onSubmit={handlePinChange}
                className="animate-in"
                style={{
                  marginTop: 12,
                  background: "var(--bg)",
                  borderRadius: 12,
                  padding: 16,
                  border: "1px solid var(--border)",
                }}
              >
                <div className="form-group">
                  <label>Current PIN</label>
                  <input
                    className="form-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={oldPin}
                    onChange={(e) =>
                      setOldPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="••••"
                    style={{ letterSpacing: "0.3em" }}
                  />
                </div>
                <div className="form-group">
                  <label>New PIN</label>
                  <input
                    className="form-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) =>
                      setNewPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="••••"
                    style={{ letterSpacing: "0.3em" }}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New PIN</label>
                  <input
                    className="form-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="••••"
                    style={{ letterSpacing: "0.3em" }}
                  />
                </div>
                {pinError && (
                  <p
                    style={{
                      color: "var(--danger)",
                      fontSize: "0.85rem",
                      marginBottom: 10,
                    }}
                  >
                    {pinError}
                  </p>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  Update PIN
                </button>
              </form>
            )}
          </section>

          {/* Contact Us */}
          <section>
            <h2 style={sectionLabel}>Support</h2>
            <button
              className="btn btn-outline"
              style={{ width: "100%", justifyContent: "space-between" }}
              onClick={() => setShowContact(!showContact)}
            >
              <span>📞 Contact Us</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {showContact ? "▲" : "▼"}
              </span>
            </button>
            {showContact && (
              <div
                className="animate-in"
                style={{
                  marginTop: 12,
                  background: "var(--bg)",
                  borderRadius: 12,
                  padding: 16,
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    marginBottom: 14,
                    lineHeight: 1.6,
                  }}
                >
                  Our customer care team is available 24/7 for account freezes,
                  fraud reports, and general support.
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <a
                    href="tel:+18007328735"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "var(--bg-elevated)",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>📞</span>
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Customer Care
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--accent)" }}>
                        +1 (800) SECURE-5
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        +1 800 732 8735
                      </div>
                    </div>
                  </a>
                  <a
                    href="mailto:support@secureflow.app"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "var(--bg-elevated)",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>✉️</span>
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Email Support
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--accent)" }}>
                        support@secureflow.app
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Edit email/phone modal */}
      {editField && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1200 }}
          onClick={() => setEditField(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 400 }}
          >
            {editField === "name" ? (
              <form onSubmit={handleNameSave}>
                <h2
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Change Name
                </h2>
                <div className="form-group">
                  <label>Display name</label>
                  <input
                    className="form-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
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
                    onClick={() => setEditField(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : !otpStep ? (
              <form onSubmit={sendOtpForEdit}>
                <h2
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Change {editField === "email" ? "Email" : "Phone"}
                </h2>
                <div className="form-group">
                  <label>
                    New {editField === "email" ? "email" : "phone number"}
                  </label>
                  <input
                    className="form-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    type={editField === "email" ? "email" : "tel"}
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
                    onClick={() => setEditField(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={confirmEdit}>
                <h2
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Verify OTP
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    marginBottom: 14,
                  }}
                >
                  OTP sent to your current{" "}
                  {editField === "email" ? "email" : "phone"}{" "}
                  <strong>
                    ({editField === "email" ? user?.email : user?.phone})
                  </strong>
                  .
                  <br />
                  Enter the OTP sent to your registered contact.
                </p>
                <div className="form-group">
                  <input
                    className="form-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    style={{
                      letterSpacing: "0.3em",
                      textAlign: "center",
                      fontSize: "1.2rem",
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
                    onClick={() => setOtpStep(false)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Confirm
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const sectionLabel = {
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  letterSpacing: "0.04em",
  marginBottom: 12,
  textTransform: "uppercase",
};

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        flexShrink: 0,
        background: on ? "var(--accent)" : "var(--bg-hover)",
        position: "relative",
        transition: "background 0.2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: on ? "var(--accent-on)" : "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}
