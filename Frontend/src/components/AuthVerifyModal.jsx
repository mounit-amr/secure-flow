import { useState, useEffect } from 'react'

/**
 * Shared biometric → PIN verification modal.
 * onSuccess() called after both steps pass.
 */
export default function AuthVerifyModal({ open, title, subtitle, onSuccess, onCancel, expectedPin = '1234' }) {
  const [step, setStep] = useState('biometric') // biometric | pin
  const [bioProgress, setBioProgress] = useState(0)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('biometric')
    setBioProgress(0)
    setPin('')
    setError('')
    let p = 0
    const interval = setInterval(() => {
      p += 10
      setBioProgress(p)
      if (p >= 100) {
        clearInterval(interval)
        setTimeout(() => setStep('pin'), 250)
      }
    }, 70)
    return () => clearInterval(interval)
  }, [open])

  if (!open) return null

  const handlePin = (e) => {
    e.preventDefault()
    if (pin !== expectedPin) {
      setError('Incorrect PIN')
      setPin('')
      return
    }
    onSuccess()
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        {step === 'biometric' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>👆</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{title || 'Biometric Verification'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
              {subtitle || 'Confirm your identity'}
            </p>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--bg)', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                height: '100%', width: `${bioProgress}%`, background: 'var(--accent)',
                transition: 'width 0.07s linear', borderRadius: 4,
              }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{bioProgress}%</p>
          </>
        )}

        {step === 'pin' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔢</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Enter Security PIN</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
              Enter your security PIN
            </p>
            <form onSubmit={handlePin}>
              <input
                className="form-input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                style={{ letterSpacing: '0.4em', fontSize: '1.4rem', textAlign: 'center', marginBottom: 12 }}
                autoFocus
              />
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 10 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={pin.length < 4}>
                  Confirm
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
