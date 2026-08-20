import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useState, useRef, useEffect } from 'react'
import Brand from './Brand'

export default function Navbar({ variant = 'landing', showBack = false }) {
  const { user, logout } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    // use click (not mousedown) so the toggle click can finish first
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const homePath = user?.role === 'admin' ? '/admin' : '/dashboard'

  if (variant === 'app') {
    return (
      <header className="app-header">
        {showBack ? (
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate(homePath)}
            aria-label="Back"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
            }}
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
        ) : (
          <span className="greeting-name">{user?.name || 'User'}</span>
        )}

        <Link to={homePath} style={{ textDecoration: 'none' }}>
          <Brand variant="lockup-dark" size={34} wordSize={22} />
        </Link>

        <div style={{ position: 'relative', zIndex: 400 }} ref={menuRef}>
          <button
            type="button"
            className="menu-dots"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <rect y="3" width="20" height="2" rx="1" />
              <rect y="9" width="20" height="2" rx="1" />
              <rect y="15" width="20" height="2" rx="1" />
            </svg>
          </button>

          {menuOpen && (
            <div className="menu-dropdown animate-scale" role="menu">
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
              <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '6px 0' }} />
              <button
                type="button"
                onClick={handleLogout}
                style={{ ...menuItemStyle(false), width: '100%', textAlign: 'left', color: 'var(--critical-red)' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
    )
  }

  // Landing / marketing header
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'linear-gradient(120deg, var(--navy-deep) 0%, var(--navy-mid) 100%)',
        boxShadow: '0 4px 24px rgba(10,18,31,0.25)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          height: 72,
        }}
      >
        <div />
        <Link to="/" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
          <Brand variant="lockup-dark" size={42} wordSize={28} />
        </Link>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Link
            to="/login"
            className="btn btn-outline"
            style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'var(--on-navy)' }}
          >
            Sign In
          </Link>
          <Link to="/signup" className="btn btn-primary hide-mobile">
            Get Started
          </Link>
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
    color: active ? 'var(--teal)' : 'rgba(255,255,255,0.85)',
    background: active ? 'rgba(47,217,201,0.12)' : 'transparent',
    transition: 'background 0.15s, color 0.15s',
    fontWeight: active ? 600 : 400,
  }
}
