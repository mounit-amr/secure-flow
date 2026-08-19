import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { features, howItWorks, bankLogos } from '../data/mockData'

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) entry.target.classList.add('visible') },
      { threshold: 0.12 }
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
  return ref
}

export default function Landing() {
  const pageRef = useReveal()

  return (
    <div ref={pageRef}>
      <Navbar variant="landing" />

      {/* ===== HERO ===== */}
      <section style={{
        minHeight: '100vh', paddingTop: 72,
        display: 'flex', alignItems: 'center',
        background: `
          radial-gradient(ellipse 70% 50% at 20% 40%, rgba(0,229,255,0.07), transparent),
          radial-gradient(ellipse 50% 40% at 80% 20%, rgba(255,45,85,0.06), transparent),
          var(--bg)
        `,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div className="float-anim" style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.08), transparent 70%)',
          top: '10%', left: '-5%', pointerEvents: 'none',
        }} />
        <div className="float-anim" style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,45,85,0.07), transparent 70%)',
          bottom: '15%', right: '5%', pointerEvents: 'none', animationDelay: '1.5s',
        }} />

        <div className="container" style={{
          display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, alignItems: 'center',
          paddingTop: 48, paddingBottom: 64,
        }}>
          <div className="animate-in">
            <div style={{
              display: 'inline-flex', padding: '6px 14px',
              background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
              letterSpacing: '0.04em', color: 'var(--accent)', marginBottom: 24,
            }}>
              ⚡ STOP COMPROMISE IN SECONDS
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 3.8rem)', fontWeight: 800,
              lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 20,
            }}>
              Defeat the<br />
              <span style={{
                background: 'linear-gradient(135deg, #00e5ff, #7c5cfc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>First-Hour Cliff</span>
            </h1>

            <p style={{
              fontSize: '1.15rem', lineHeight: 1.7, color: 'var(--text-secondary)',
              marginBottom: 32, maxWidth: 500,
            }}>
              Most identity & fraud damage happens in the first 60 minutes of a breach.
              SecureFlow detects compromise and freezes every linked bank, UPI & wallet — instantly.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 48 }}>
              <Link to="/signup" className="btn btn-primary btn-lg">Lock Your Accounts Now</Link>
              <a href="#how-it-works" className="btn btn-outline btn-lg">See How It Works</a>
            </div>

            <div style={{ display: 'flex', gap: 36 }} className="stagger">
              {[
                { value: '$4.2M+', label: 'Fraud Prevented' },
                { value: '1.8s', label: 'Avg. Isolation' },
                { value: '15K+', label: 'Portals Protected' },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="animate-in delay-2" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glow-anim" style={{
              width: 300, background: 'linear-gradient(180deg, #1a2236, #0e1420)',
              borderRadius: 36, border: '3px solid #2a3550', padding: '12px 14px 20px',
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.65)',
            }}>
              <div style={{ width: 100, height: 22, background: '#070b14', borderRadius: '0 0 14px 14px', margin: '0 auto 8px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 6px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>9:41</span><span>●●●</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>SecureFlow Mobile</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
                  CONNECTED TO 4 ACCOUNTS
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #ff2d55 0%, #ff5e3a 100%)',
                borderRadius: 18, padding: '20px 16px', textAlign: 'center', marginBottom: 14,
                boxShadow: '0 10px 30px rgba(255,45,85,0.35)',
              }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🛡️</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>ONE-TAP FREEZE</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Instantly lock Chase, Wells Fargo, Coinbase & Apple Pay</div>
              </div>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>
                ACTIVE SECURITY MONITOR
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,59,92,0.4)', borderRadius: 12, padding: '11px 13px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Chase Card-Not-Present</span>
                  <span className="risk-badge risk-critical">CRITICAL</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Moscow, RU · $2,450.00</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, padding: '11px 13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Wells Fargo Wire</span>
                  <span className="risk-badge risk-medium">SUSPICIOUS</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>New recipient + IP Mismatch</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <section style={{ padding: '90px 0', background: 'var(--bg-elevated)' }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: 14 }}>The First-Hour Cliff is real</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Once an attacker has your credentials, the clock starts. In under 60 minutes they can drain accounts, open new lines of credit, and disappear.
            </p>
          </div>
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { icon: '⏱️', title: 'Minutes, not days', desc: 'Average time from breach to first fraudulent transaction is under 12 minutes.' },
              { icon: '💸', title: '$4,200 average loss', desc: 'Before victims even notice something is wrong, damage is already done.' },
              { icon: '🌍', title: 'Cross-border attacks', desc: 'Moscow, Lagos, Manila — location mismatch is one of the strongest signals.' },
              { icon: '🔗', title: 'Linked accounts cascade', desc: 'One compromised login can unlock every bank and UPI linked to that device.' },
            ].map((c) => (
              <div key={c.title} className="card reveal" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{c.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{c.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" style={{ padding: '90px 0' }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: 12 }}>Built for the First Hour</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>
              Every feature is designed to stop fraud before it becomes irreversible.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
            {features.map((f, i) => (
              <div key={f.title} className="card reveal" style={{ transition: 'transform 0.3s, border-color 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: 'var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', marginBottom: 14,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" style={{ padding: '90px 0', background: 'var(--bg-elevated)' }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: 12 }}>How SecureFlow Works</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Four steps from vulnerable to protected.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28, position: 'relative' }}>
            {howItWorks.map((s) => (
              <div key={s.step} className="reveal" style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-dim)',
                  color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.3rem', margin: '0 auto 16px',
                  border: '2px solid rgba(0,229,255,0.3)',
                }}>{s.step}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SUPPORTED ===== */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>Connect everything you use</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Banks, UPI apps, wallets & crypto — one control plane.</p>
          </div>
          <div className="stagger" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14,
          }}>
            {bankLogos.map((b) => (
              <div key={b.name} className="card reveal" style={{
                textAlign: 'center', padding: '18px 10px', cursor: 'default',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', padding: 6,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                }}>
                  <img
                    src={`https://logo.clearbit.com/${b.domain}`}
                    alt={b.name}
                    style={{ width: 36, height: 36, objectFit: 'contain' }}
                    onError={(e) => {
                      if (!e.target.dataset.fallback) {
                        e.target.dataset.fallback = '1'
                        e.target.src = `https://www.google.com/s2/favicons?domain=${b.domain}&sz=128`
                      } else {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = `<span style="font-weight:800;color:${b.color};font-size:1.1rem">${b.name[0]}</span>`
                      }
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{b.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST ===== */}
      <section id="trust" style={{ padding: '90px 0', background: 'var(--bg-elevated)' }}>
        <div className="container" style={{ maxWidth: 720, textAlign: 'center' }}>
          <div className="reveal">
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: 16 }}>Trust & Transparency</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 36, lineHeight: 1.75, fontSize: '1.05rem' }}>
              We never move your money. We only monitor and freeze. Device signals stay encrypted.
              Built for everyday users and senior citizens — clear language, large touch targets, no jargon.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              {['Read-only + Freeze only', 'Explainable AI', 'No hidden scores', 'Accessible design', 'On-device biometrics'].map((t) => (
                <span key={t} style={{
                  padding: '10px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 999, fontSize: '0.85rem', color: 'var(--text-secondary)',
                }}>✓ {t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section style={{ padding: '100px 0', textAlign: 'center', position: 'relative' }}>
        <div className="container reveal">
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, marginBottom: 16 }}>
            Don't wait for the first hour to end
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: '1.1rem' }}>
            Link your accounts in under 2 minutes and stay protected.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
            Get Started Free →
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container">
          © 2026 SecureFlow. Built to defeat the first-hour cliff.
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          section > .container > div[style*="grid-template-columns: 1.1fr"] {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          section > .container > div[style*="grid-template-columns: 1.1fr"] > div:first-child {
            display: flex; flex-direction: column; align-items: center;
          }
        }
      `}</style>
    </div>
  )
}
