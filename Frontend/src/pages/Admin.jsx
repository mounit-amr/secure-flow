import { Link, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'

export default function Admin() {
  const { user, users, allTransactions, isAuthenticated } = useApp()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />

  const customers = users.filter((u) => u.role === 'user')
  const flagged = allTransactions.filter((t) => t.riskLevel === 'high' || t.riskLevel === 'critical' || t.status === 'flagged')
  const volume = allTransactions
    .filter((t) => t.direction === 'out' && t.category === 'P2P')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const formatDT = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    })

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', paddingBottom: 60 }}>
      <Navbar variant="app" />
      <div className="container" style={{ paddingTop: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Admin console</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
          Account system overview · fraud signals · user balances
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Users</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{customers.length}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total volume (P2P out)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{volume.toLocaleString('en-IN')}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Flagged / high risk</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>{flagged.length}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All transactions</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{allTransactions.length}</div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Customer accounts</h2>
        <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
          {customers.map((u) => (
            <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{u.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email} · {u.upiId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: 'var(--accent)' }}>
                  ₹{u.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Health {u.healthScore}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Recent ledger</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {allTransactions.slice(0, 15).map((txn, i) => (
            <div
              key={txn.id + i}
              style={{
                padding: '14px 18px',
                borderBottom: i < 14 ? '1px solid var(--border)' : 'none',
                display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{txn.merchant}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {txn.fromName} → {txn.toName} · {formatDT(txn.date)} · {txn.day} · 📍 {txn.location}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: txn.amount > 0 ? 'var(--success)' : 'var(--text)' }}>
                  {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                </div>
                <span className={`risk-badge risk-${txn.riskLevel}`}>{txn.riskLevel}</span>
              </div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Payment rails & deep fraud models are owned by partner modules; this admin view is the shared account-system roof.
        </p>
      </div>
    </div>
  )
}
