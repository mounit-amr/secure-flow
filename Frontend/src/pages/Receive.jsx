import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'

export default function Receive() {
  const { user } = useApp()
  const payload = `secureflow://pay?uid=${user?.id}&name=${encodeURIComponent(user?.name || '')}&upi=${encodeURIComponent(user?.upiId || '')}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=ffffff&color=0d1210&data=${encodeURIComponent(payload)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload)
      alert('QR payload copied — paste it on the Send money screen')
    } catch {
      alert(payload)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', paddingBottom: 80 }}>
      <Navbar variant="app" showBack />
      <div className="container" style={{ paddingTop: 28, maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Receive money</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 28 }}>
          Let others scan this QR or paste the payload in Send money
        </p>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            padding: 16, background: '#fff', borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}>
            <img src={qrUrl} alt="Payment QR" width={240} height={240} style={{ display: 'block' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.upiId}</div>
            <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 6 }}>
              ₹{(user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} available
            </div>
          </div>
          <code style={{
            fontSize: '0.7rem', wordBreak: 'break-all', color: 'var(--text-muted)',
            background: 'transparent', padding: '8px 12px', borderRadius: 8, maxWidth: '100%',
          }}>
            {payload}
          </code>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={copy}>
            Copy QR payload
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Open a second browser / incognito, log in as the other demo user, go to <strong>Send money</strong>,
          paste this payload or select this user, and pay. Balances update on both sides.
        </p>
      </div>
    </div>
  )
}
