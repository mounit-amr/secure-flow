import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Signup() {
  const [step, setStep] = useState(1); // 1: details, 2: otp, 3: done
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    securityPin: "",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useApp();
  const navigate = useNavigate();

  const update = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleDetails = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const password = form.password.trim();
    const securityPin = form.securityPin.trim();
    if (!name || !email || !phone || !password || !securityPin) {
      setError("Please fill all fields");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid mobile number");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/^\d{4,6}$/.test(securityPin)) {
      setError("PIN must contain 4 to 6 digits");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 700);
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    if (otp !== "123456") {
      setError("Invalid OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password.trim(),
        securityPin: form.securityPin.trim(),
      });
      if (!result.ok) {
        setError(result.error || "Registration failed");
        return;
      }
      setStep(3);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ display: "inline-block" }}>
            <img
              src="/secureflow-wordmark.svg"
              alt="SecureFlow"
              style={{ height: 56, width: "auto", maxWidth: "100%" }}
            />
          </Link>
          <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>
            {step === 1 && "Create your account"}
            {step === 2 && "Verify your identity"}
            {step === 3 && "Welcome aboard!"}
          </p>
        </div>

        <div className="card">
          {step === 1 && (
            <form onSubmit={handleDetails}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Alex Rivera"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Min 8 characters"
                />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  className="form-input"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="form-group">
                <label>Security PIN</label>
                <input
                  className="form-input"
                  type="password"
                  inputMode="numeric"
                  value={form.securityPin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      securityPin: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  maxLength={6}
                  placeholder="4 to 6 digits"
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
                {loading ? "Sending OTP…" : "Continue"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtp}>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  marginBottom: 16,
                }}
              >
                Enter the OTP sent to {form.email}.
              </p>
              <div className="form-group">
                <label>6-digit OTP</label>
                <input
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
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
                disabled={loading}
              >
                {loading ? "Creating account…" : "Verify & Create Account"}
              </button>
            </form>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
              <h3 style={{ marginBottom: 8 }}>Account created</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Redirecting to your dashboard…
              </p>
            </div>
          )}
        </div>

        {step < 3 && (
          <p
            style={{
              textAlign: "center",
              marginTop: 24,
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--accent)" }}>
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
