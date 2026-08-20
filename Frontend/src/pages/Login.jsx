import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Brand from "../components/Brand";

export default function Login() {
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.ok) {
        setError(result.error || "Login failed");
        return;
      }
      setPendingUser(result.user);
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = (e) => {
    e.preventDefault();
    if (otp !== "123456") {
      setError("Invalid OTP");
      return;
    }
    navigate(pendingUser?.role === "admin" ? "/admin" : "/dashboard");
  };

  const quickFill = async (role) => {
    let e = "aarav@secureflow.app";
    let p = "user1";
    if (role === "user2") {
      e = "ved@secureflow.app";
      p = "user2";
    } else if (role === "admin") {
      e = "admin@secureflow.app";
      p = "admin";
    }
    setEmail(e);
    setPassword(p);
    setError("");
    setLoading(true);
    try {
      const result = await login(e, p);
      if (!result.ok) {
        setError(result.error || "Login failed");
        return;
      }
      setPendingUser(result.user);
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "linear-gradient(180deg, #0A1330 0%, #0F1B3D 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link to="/" style={{ display: "inline-block", textDecoration: "none" }}>
            <Brand variant="lockup-dark" size={48} wordSize={28} />
          </Link>
          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: 8,
              fontSize: "0.95rem",
            }}
          >
            {step === "credentials"
              ? "Sign in to your account"
              : "Verify with OTP"}
          </p>
        </div>

        <div className="card">
          {step === "credentials" ? (
            <form onSubmit={handleCredentials}>
              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p
                  style={{
                    color: "var(--danger)",
                    fontSize: "0.85rem",
                    marginBottom: 12,
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? "Signing in…" : "Continue"}
              </button>

              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: 10,
                    textAlign: "center",
                  }}
                >
                  Demo accounts
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => quickFill("user1")}
                  >
                    User 1 — Aarav Sharma (aarav@secureflow.app / user1)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => quickFill("user2")}
                  >
                    User 2 — Ved Patel (ved@secureflow.app / user2)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => quickFill("admin")}
                  >
                    Admin (admin@secureflow.app / admin)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtp}>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  marginBottom: 16,
                }}
              >
                OTP sent for <strong>{pendingUser?.name}</strong>.
              </p>
              <div className="form-group">
                <label>OTP</label>
                <input
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  style={{
                    letterSpacing: "0.3em",
                    fontSize: "1.2rem",
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
                    marginBottom: 12,
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                Verify & Enter
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
