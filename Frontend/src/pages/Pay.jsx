import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

export default function Pay() {
  const {
    user,
    accounts,
    otherUsers,
    transferMoney,
    isGlobalFrozen,
    getAccountPin,
    isUserFrozen,
  } = useApp();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [locStatus, setLocStatus] = useState("detecting");
  const [editingLoc, setEditingLoc] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [showFrozenNotice, setShowFrozenNotice] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const locInputRef = useRef(null);
  const pinRef = useRef(null);
  const navigate = useNavigate();

  const expectedPin = getAccountPin(accounts?.[0]?.id) || "1234";
  console.log("[Pay] accounts[0]:", accounts?.[0]);
  console.log("[Pay] expectedPin:", expectedPin);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocStatus("denied");
      setLocation("Location unavailable");
      return;
    }
    setLocStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "en" } },
          );
          if (res.ok) {
            const data = await res.json();
            const a = data.address || {};
            const parts = [
              a.suburb || a.neighbourhood || a.village,
              a.city || a.town || a.state,
              a.country,
            ].filter(Boolean);
            setLocation(
              parts.length ? `${parts.join(", ")} (${coords})` : coords,
            );
          } else {
            setLocation(coords);
          }
        } catch {
          setLocation(coords);
        }
        setLocStatus("ok");
      },
      () => {
        setLocStatus("denied");
        setLocation("Permission denied · location not shared");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, []);

  useEffect(() => {
    if (editingLoc && locInputRef.current) {
      locInputRef.current.focus();
      locInputRef.current.select();
    }
  }, [editingLoc]);

  useEffect(() => {
    if (showPin && pinRef.current) pinRef.current.focus();
  }, [showPin]);

  const digits = phone.replace(/\D/g, "");
  const recipient = otherUsers.find((u) => {
    const ud = (u.phone || "").replace(/\D/g, "");
    return (
      ud &&
      digits.length >= 8 &&
      (ud.endsWith(digits) || digits.endsWith(ud) || ud.includes(digits))
    );
  });

  const amtNum = Number(amount) || 0;
  const senderFrozen = isGlobalFrozen || isUserFrozen(user?.id);
  const canPay = !!recipient && amtNum > 0 && !loading && !senderFrozen;

  const openPinStep = (e) => {
    e?.preventDefault?.();
    setError("");
    setPinError("");
    if (senderFrozen) {
      setError("Account is frozen. You cannot send or receive money.");
      return;
    }
    if (!recipient) {
      setError("No SecureFlow user found with that phone number");
      return;
    }
    if (amtNum <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setPin("");
    setShowPin(true);
  };

  const confirmWithPin = (e) => {
    e?.preventDefault?.();
    console.log(
      "[Pay] PIN check - entered:",
      pin,
      "expected:",
      expectedPin,
      "match:",
      pin === expectedPin,
    );
    if (pin !== expectedPin) {
      setPinError("Incorrect PIN");
      setPin("");
      return;
    }
    setShowPin(false);
    setLoading(true);
    setTimeout(() => {
      const result = transferMoney({
        toUserId: recipient.id,
        amount: amtNum,
        location: location || "Location not available",
        note,
      });
      setLoading(false);
      setPin("");
      if (!result.ok) {
        if (
          result.error ===
          "Account is frozen. You cannot send or receive money."
        ) {
          setShowFrozenNotice(true);
        } else {
          setError(result.error);
        }
        return;
      }
      setSuccessData({
        amount: amtNum,
        name: recipient.name,
        riskLevel: result.riskLevel,
      });
      setAmount("");
      setNote("");
      setPhone("");
    }, 600);
  };

  if (successData) {
    return (
      <div
        className="pay-success-overlay"
        onClick={() => navigate("/dashboard")}
      >
        <div
          className="pay-success-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pay-success-ring">
            <div className="pay-success-check">✓</div>
          </div>
          <div className="pay-success-label">Payment Successful</div>
          <div className="pay-success-amount">
            {successData.amount.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            })}
          </div>
          <div className="pay-success-to">to {successData.name}</div>
          <p className="pay-success-hint">Tap anywhere to continue</p>
        </div>
        <div
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
          onClick={() => navigate("/dashboard")}
        />
      </div>
    );
  }

  return (
    <div className="page-overlay">
      <div
        style={{
          minHeight: "100vh",
          background: "transparent",
          paddingBottom: 120,
        }}
      >
        <Navbar variant="app" showBack />
        <div className="container" style={{ paddingTop: 28, maxWidth: 480 }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: 6,
              fontFamily: "var(--font-display)",
            }}
          >
            Pay
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              marginBottom: 20,
            }}
          >
            Balance{" "}
            <strong style={{ color: "var(--trust-blue)" }}>
              {(user?.balance || 0).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            </strong>
          </p>

          <div className="card">
            <div className="form-group">
              <label>To (mobile number)</label>
              <input
                className="form-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                autoFocus
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: 6,
                }}
              >
                Demo: Ved{" "}
                <code style={{ color: "var(--accent)" }}>91234 56789</code>
                {" · "}Aarav{" "}
                <code style={{ color: "var(--accent)" }}>98765 43210</code>
              </p>
            </div>

            {digits.length >= 8 && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  marginBottom: 16,
                  fontSize: "0.9rem",
                  background: recipient
                    ? "var(--calm-green-tint)"
                    : "var(--critical-red-tint)",
                  border: `1px solid ${recipient ? "var(--calm-green)" : "var(--critical-red)"}`,
                  color: recipient
                    ? "var(--calm-green)"
                    : "var(--critical-red)",
                }}
              >
                {recipient ? (
                  <>
                    Paying{" "}
                    <strong style={{ color: "var(--text)" }}>
                      {recipient.name}
                    </strong>
                    <span
                      style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                    >
                      {" "}
                      · {recipient.phone}
                    </span>
                  </>
                ) : (
                  "No user found with this number"
                )}
              </div>
            )}

            <div className="form-group">
              <label>Amount</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    fontSize: "1.15rem",
                  }}
                >
                  ₹
                </span>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    paddingLeft: 32,
                    fontSize: "1.35rem",
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <div
                onClick={() => {
                  if (!editingLoc) setEditingLoc(true);
                }}
                style={{
                  padding: editingLoc ? 0 : "12px 14px",
                  borderRadius: 10,
                  background: "var(--surface-alt)",
                  border: "1px solid var(--border)",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  cursor: "text",
                  minHeight: 46,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {editingLoc ? (
                  <input
                    ref={locInputRef}
                    className="form-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onBlur={() => setEditingLoc(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setEditingLoc(false);
                      }
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      boxShadow: "none",
                      padding: "12px 14px",
                      fontSize: "0.85rem",
                    }}
                  />
                ) : (
                  <span style={{ width: "100%" }}>
                    {locStatus === "detecting" && "📍 Detecting your location…"}
                    {locStatus !== "detecting" && (
                      <>📍 {location || "Tap to set location"}</>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Note (optional)</label>
              <input
                className="form-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a message"
              />
            </div>

            {error && (
              <p
                style={{
                  color: "var(--danger)",
                  fontSize: "0.85rem",
                  marginTop: 12,
                }}
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="upi-pay-bar">
          <div className="upi-pay-bar-inner">
            <div className="upi-pay-meta">
              <div className="upi-pay-meta-label">Paying</div>
              <div className="upi-pay-meta-value">
                {recipient ? recipient.name : "—"}
              </div>
            </div>
            <button
              type="button"
              className="upi-pay-btn"
              disabled={!canPay}
              onClick={openPinStep}
            >
              {loading ? (
                <span className="transfer-spinner" />
              ) : (
                <>
                  PAY
                  {amtNum > 0 && (
                    <span className="upi-pay-amt">
                      {amtNum.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {showPin && (
          <div
            className="modal-overlay"
            style={{ zIndex: 1200 }}
            onClick={() => setShowPin(false)}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 360, textAlign: "center" }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔒</div>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginBottom: 6,
                  fontFamily: "var(--font-display)",
                }}
              >
                Enter UPI PIN
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  marginBottom: 6,
                }}
              >
                Paying{" "}
                <strong style={{ color: "var(--text)" }}>
                  {amtNum.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </strong>{" "}
                to{" "}
                <strong style={{ color: "var(--text)" }}>
                  {recipient?.name}
                </strong>
              </p>
              <form onSubmit={confirmWithPin}>
                <input
                  ref={pinRef}
                  className="form-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  style={{
                    letterSpacing: "0.45em",
                    fontSize: "1.5rem",
                    textAlign: "center",
                    marginTop: 16,
                    marginBottom: 10,
                  }}
                  autoComplete="off"
                />
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
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setShowPin(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={pin.length < 4}
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showFrozenNotice && (
          <div
            className="modal-overlay"
            style={{ zIndex: 1300 }}
            onClick={() => setShowFrozenNotice(false)}
          >
            <div
              className="modal animate-in"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 380, textAlign: "center" }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🚫</div>
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  marginBottom: 8,
                  fontFamily: "var(--font-display)",
                }}
              >
                Transaction Cancelled
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  marginBottom: 20,
                }}
              >
                The recipient's account is frozen. You cannot send or receive
                money from this account.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={() => setShowFrozenNotice(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
