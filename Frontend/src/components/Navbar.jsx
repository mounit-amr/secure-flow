import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useState, useRef, useEffect } from 'react'

export default function Navbar({ variant = 'landing', showBack = false }) {
  const { user, logout, isGlobalFrozen } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const homePath = user?.role === 'admin' ? '/admin' : '/dashboard'

  if (variant === 'app') {
    return (
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--surface-navy)',
        height: 'var(--header-h)',
        boxShadow: '0 4px 24px rgba(10,18,31,0.18)',
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          height: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start' }}>
            {showBack && (
              <button
                className="back-btn"
                onClick={() => navigate('/dashboard')}
                aria-label="Back to dashboard"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: 'var(--on-navy)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            )}
            <span style={{ fontSize: '0.95rem', color: 'var(--on-navy)', fontWeight: 600 }}>
              {user?.name || 'User'}
            </span>
            {isGlobalFrozen && (
              <span className="risk-badge risk-critical">FROZEN</span>
            )}
          </div>

          {/* Center: official SecureFlow wordmark */}
          <Link to={homePath} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src="/secureflow-nav.svg"
              alt="SecureFlow"
              style={{ height: 36, width: 'auto', maxWidth: 'min(220px, 48vw)' }}
            />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              style={{
                width: 38, height: 38, borderRadius: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: 'var(--on-navy-muted)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--freeze-cyan)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--on-navy-muted)' }}
            >
              <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 1 }} />
            </button>

            {menuOpen && (
              <div className="animate-scale" style={{
                position: 'absolute', top: 'calc(var(--header-h) - 4px)', right: 20,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '8px 0', minWidth: 200,
                boxShadow: 'var(--shadow)', zIndex: 200,
              }}>
                {user?.role !== 'admin' && (
                  <>
                    <Link to="/accounts" onClick={() => setMenuOpen(false)} style={menuItemStyle(location.pathname === '/accounts')}>
                      🏦 Linked Accounts
                    </Link>
                    <Link to="/history" onClick={() => setMenuOpen(false)} style={menuItemStyle(location.pathname === '/history')}>
                      📋 History
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} style={menuItemStyle(location.pathname === '/admin')}>
                    🛡️ Admin
                  </Link>
                )}
                <Link to="/settings" onClick={() => setMenuOpen(false)} style={menuItemStyle(location.pathname === '/settings')}>
                  ⚙️ Settings
                </Link>
                <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                <button onClick={handleLogout} style={{ ...menuItemStyle(false), width: '100%', textAlign: 'left', color: 'var(--critical-red)' }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--surface-navy)',
      boxShadow: '0 4px 24px rgba(10,18,31,0.18)',
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        height: 72,
      }}>
        <div />
        <Link to="/" style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src="/secureflow-nav.svg"
            alt="SecureFlow"
            style={{ height: 40, width: 'auto', maxWidth: 'min(260px, 55vw)' }}
          />
        </Link>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Link to="/login" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'var(--on-navy)' }}>Sign In</Link>
          <Link to="/signup" className="btn btn-primary hide-mobile">Get Started</Link>
        </div>
      </div>
    </header>
  )
}

function menuItemStyle(active) {
  return {
    display: 'block',
    padding: '10px 18px',
    fontSize: '0.9rem',
    color: active ? 'var(--trust-blue)' : 'var(--text-secondary)',
    background: active ? 'var(--trust-blue-tint)' : 'transparent',
    transition: 'background 0.15s',
  }
}
