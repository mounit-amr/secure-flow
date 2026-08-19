import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

export default function ToastContainer() {
  const { alerts, dismissAlert, settings } = useApp()
  const duration = (settings?.toastDuration || 12) * 1000

  useEffect(() => {
    if (!alerts.length) return
    const timers = alerts.map((alert) =>
      setTimeout(() => dismissAlert(alert.id), duration)
    )
    return () => timers.forEach(clearTimeout)
  }, [alerts, duration, dismissAlert])

  if (!alerts.length) return null

  return (
    <div className="toast-container">
      {alerts.map((alert) => {
        const isHigh = alert.type === 'high' || alert.type === 'critical'
        const isMed = alert.type === 'medium'
        const isOk = alert.type === 'success'

        return (
          <div
            key={alert.id}
            className="animate-in"
            style={{
              background: 'var(--bg-card)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
              border: '1px solid var(--border-light)',
              borderLeft: `3px solid ${
                isHigh ? 'var(--danger)' : isMed ? 'var(--warning)' : isOk ? 'var(--success)' : 'var(--accent)'
              }`,
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%', marginTop: 5, flexShrink: 0,
              background: isHigh ? 'var(--danger)' : isMed ? 'var(--warning)' : isOk ? 'var(--success)' : 'var(--accent)',
              boxShadow: isHigh ? '0 0 8px var(--danger)' : isOk ? '0 0 8px var(--success)' : 'none',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>
                {alert.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {alert.message}
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1, padding: 2 }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
