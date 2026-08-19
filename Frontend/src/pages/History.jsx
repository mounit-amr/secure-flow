import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

export default function History() {
  const { transactions } = useApp();
  const [filter, setFilter] = useState("all");

  const filtered = transactions.filter((t) => {
    if (filter !== "all" && t.riskLevel !== filter) return false;
    return true;
  });

  return (
    <div className="page-overlay">
      <div
        style={{
          minHeight: "100vh",
          background: "transparent",
          paddingBottom: 80,
        }}
      >
        <Navbar variant="app" showBack />
        <div className="container" style={{ paddingTop: 28 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 6 }}>
            Transaction History
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              marginBottom: 20,
            }}
          >
            Audit past activity and risk decisions
          </p>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {["all", "low", "medium", "high", "critical"].map((f) => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`}
                onClick={() => setFilter(f)}
                style={{ textTransform: "capitalize" }}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {filtered.length === 0 && (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No transactions match this filter.
              </div>
            )}
            {filtered.map((txn, i) => (
              <Link
                key={txn.id}
                to={`/transaction/${txn.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  borderBottom:
                    i < filtered.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
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
                    {["confirmed", "cancelled", "reported"].includes(
                      txn.status,
                    ) && (
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
                            : "REPORTED"}
                      </span>
                    )}
                    {!["confirmed", "cancelled", "reported"].includes(
                      txn.status,
                    ) &&
                      txn.riskLevel === "low" && (
                        <span className="badge-no-verify">
                          NO VERIFY NEEDED
                        </span>
                      )}
                    {!["confirmed", "cancelled", "reported"].includes(
                      txn.status,
                    ) &&
                      txn.riskLevel !== "low" && (
                        <span className="badge-verify-needed">
                          NEEDS VERIFY
                        </span>
                      )}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "2px 10px",
                      marginTop: 2,
                    }}
                  >
                    <span>🏦 {txn.accountName}</span>
                    {txn.fromName && txn.toName && (
                      <span>
                        ·{" "}
                        {txn.direction === "out" ? "sent to" : "received from"}{" "}
                        {txn.direction === "out" ? txn.toName : txn.fromName}
                      </span>
                    )}
                    <span>· {txn.day || ""}</span>
                    <span>
                      ·{" "}
                      {new Date(txn.date).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <span>· 📍 {txn.location || "—"}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: txn.amount > 0 ? "var(--success)" : "var(--text)",
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
