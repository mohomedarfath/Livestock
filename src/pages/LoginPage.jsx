import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { env } from '../lib/env'
import { Alert, PageHeader, useToast } from '../components/ui'

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 18%, transparent), transparent min(60vw, 520px)), var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  shell: { width: '100%', maxWidth: '1060px', display: 'grid', gap: '24px' },
  panel: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 20px 60px var(--shadow-color)',
  },
}

const DEMO_ACCOUNTS = [
  { label: 'Platform owner', email: 'owner@clucktrack.com', password: 'owner123' },
  { label: 'Farm admin', email: 'admin@farm.com', password: 'admin123' },
  { label: 'Manager', email: 'manager@farm.com', password: 'manager123' },
  { label: 'Employee', email: 'emp@farm.com', password: 'emp123' },
  { label: 'Accountant', email: 'acc@farm.com', password: 'acc123' },
  { label: 'Shop manager', email: 'shop@farm.com', password: 'shop123' },
  { label: 'Cashier', email: 'cashier@farm.com', password: 'cashier123' },
  { label: 'Sunrise admin', email: 'owner@sunrisefarm.com', password: 'sunrise123' },
  { label: 'Hilltop manager', email: 'ops@hilltoplayers.com', password: 'hilltop123' },
]

function AuthForm({ mode, setMode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup, signInWithGoogle, resetPassword, authMode } = useAuth()
  const { showToast } = useToast()
  const isDemoMode = authMode === 'legacy-demo'
  const isFirebaseMode = authMode === 'firebase'
  const shouldShowDemoAccounts = mode === 'signin' && (isDemoMode || isFirebaseMode)
  const shouldShowGoogleAuth = isFirebaseMode && mode !== 'reset'

  const [fullName, setFullName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'signin') {
      const result = await login(email.trim(), password)
      setLoading(false)
      if (!result.success) return setError(result.error)
      navigate(location.state?.from?.pathname || '/', { replace: true })
      return
    }

    if (mode === 'signup') {
      const result = await signup({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      })
      setLoading(false)
      if (!result.success) return setError(result.error)
      let signupMessage = 'Account created. Check your inbox if email confirmation is enabled.'
      if (farmName.trim()) {
        signupMessage = 'Account created. You can create the workspace on the next screen.'
      }
      if (result.verificationEmailSent) {
        signupMessage = 'Account created. We sent a verification email to your inbox.'
      }
      setMessage(signupMessage)
      navigate('/onboarding', {
        replace: true,
        state: farmName.trim() ? { farmName: farmName.trim() } : null,
      })
      return
    }

    const result = await resetPassword(email.trim())
    setLoading(false)
    if (!result.success) return setError(result.error)
    setMessage('Password reset email sent. Check your inbox.')
  }

  async function handleGoogleAuth() {
    setError('')
    setMessage('')
    setGoogleLoading(true)

    const result = await signInWithGoogle()
    setGoogleLoading(false)
    if (!result.success) return setError(result.error)

    navigate(mode === 'signup' ? '/onboarding' : location.state?.from?.pathname || '/', {
      replace: true,
      state: mode === 'signup' && farmName.trim() ? { farmName: farmName.trim() } : null,
    })
  }

  return (
    <div style={styles.panel}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-dim)' }}>
            {isFirebaseMode ? 'Firebase auth' : isDemoMode ? 'Demo auth' : 'Setup required'}
          </p>
          <h2 style={{ margin: '6px 0 0', fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
            {mode === 'signin' && (isDemoMode ? 'Sign in with a demo account' : 'Sign in to your farm workspace')}
            {mode === 'signup' && 'Create your operator account'}
            {mode === 'reset' && 'Reset your password'}
          </h2>
        </div>
        <div className="flex rounded-full p-1" style={{ background: 'var(--surface-2)' }}>
          {['signin', ...(isDemoMode ? [] : ['signup'])].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={mode === item}
              onClick={() => {
                setMode(item)
                setError('')
                setMessage('')
              }}
              className="focus-ring px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: mode === item ? 'var(--accent)' : 'transparent',
                color: mode === item ? '#fff' : 'var(--text-muted)',
              }}
            >
              {item === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {shouldShowGoogleAuth && (
          <>
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="focus-ring w-full rounded-xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              disabled={loading || googleLoading}
              style={{
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 24px color-mix(in srgb, var(--shadow-color) 45%, transparent)',
              }}
            >
              <span className="flex items-center justify-center gap-3">
                <span
                  aria-hidden
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full font-bold"
                  style={{ color: '#4285f4', background: '#fff' }}
                >
                  G
                </span>
                {googleLoading
                  ? 'Opening Google...'
                  : mode === 'signup'
                  ? 'Sign up with Google'
                  : 'Sign in with Google'}
              </span>
            </button>

            <div className="flex items-center gap-3 text-xs uppercase" style={{ color: 'var(--text-dim)' }}>
              <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
              <span>Email</span>
              <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            </div>
          </>
        )}

        {mode === 'signup' && !isDemoMode && (
          <>
            <div>
              <label htmlFor="fullName" className="label-text block mb-1">
                Full name
              </label>
              <input id="fullName" className="input-field" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Amina Perera" />
            </div>
            <div>
              <label htmlFor="farmName" className="label-text block mb-1">
                Farm name
              </label>
              <input id="farmName" className="input-field" value={farmName} onChange={(event) => setFarmName(event.target.value)} placeholder="Green Valley Poultry" />
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className="label-text block mb-1">
            Email
          </label>
          <input
            id="email"
            className="input-field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="owner@farm.com"
          />
        </div>

        {mode !== 'reset' && (
          <div>
            <label htmlFor="password" className="label-text block mb-1">
              Password
            </label>
            <input
              id="password"
              className="input-field"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
            />
          </div>
        )}

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}
        {message && (
          <Alert variant="success">
            {message}
          </Alert>
        )}

        {authMode === 'unconfigured' && (
          <Alert variant="warning">
            Add Firebase environment variables to enable production auth.
            {env.enableLegacyDemo ? ' Legacy demo mode is enabled for local development.' : ''}
          </Alert>
        )}

        {shouldShowDemoAccounts && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="font-semibold uppercase tracking-[.08em] mb-2 text-caption" style={{ color: 'var(--text)' }}>
              Ready-to-use accounts
            </p>
            <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: '230px' }}>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                    setError('')
                    setMessage('')
                    showToast({ variant: 'info', message: 'Demo account filled in. Click Sign in to continue.' })
                  }}
                  className="focus-ring w-full text-left rounded-lg px-3 py-2"
                  aria-label={`Use demo account ${account.email}`}
                  style={{ background: 'var(--surface)', border: '1px solid color-mix(in srgb, var(--border) 60%, transparent)', color: 'var(--text-muted)' }}
                >
                  <span className="flex items-center gap-2 font-medium" style={{ color: 'var(--text)' }}>
                    {account.label}
                    <span aria-hidden style={{ color: 'var(--accent-ink)', marginLeft: 'auto' }}>Use</span>
                  </span>
                  <span className="mt-0.5 block">{account.email} / {account.password}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading && mode === 'signin' && 'Signing in...'}
          {loading && mode === 'signup' && 'Creating account...'}
          {loading && mode === 'reset' && 'Sending reset...'}
          {!loading && mode === 'signin' && 'Sign in'}
          {!loading && mode === 'signup' && 'Create account'}
          {!loading && mode === 'reset' && 'Send reset email'}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'reset' ? 'signin' : 'reset')
            setError('')
            setMessage('')
          }}
          className="link-accent"
        >
          {mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}
        </button>
        {mode !== 'signup' && !isDemoMode ? (
          <button type="button" onClick={() => setMode('signup')} style={{ color: 'var(--text-muted)' }}>
            New here? Create an account
          </button>
        ) : !isDemoMode ? (
          <button type="button" onClick={() => setMode('signin')} style={{ color: 'var(--text-muted)' }}>
            Already have an account?
          </button>
        ) : <span />}
      </div>

      {isDemoMode && (
        <p className="mt-5 text-xs" style={{ color: 'var(--text-dim)' }}>
          Demo mode is enabled for development. Sign up and password reset are disabled until real Firebase credentials are configured.
        </p>
      )}
    </div>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState('signin')

  return (
    <div style={styles.page}>
      <div style={styles.shell} className="grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        <section style={{ ...styles.panel, background: 'linear-gradient(160deg, var(--surface) 0%, color-mix(in srgb, var(--accent) 8%, var(--surface)) 100%)' }}>
          <PageHeader
            className="mb-0"
            title="Sign in to manage a working demo livestock farm."
            subtitle="Firebase Auth handles the accounts, Firestore stores each farm workspace, and the seeded demo data fills the dashboards with animal groups, logs, stock, staff, sales, and expenses."
            breadcrumbs={[{ label: 'LivestockTrack farm workspace' }]}
          />

          <div className="grid sm:grid-cols-2 gap-3 mt-8">
            {[
              ['Tenants', 'Tenant-scoped Firebase workspaces'],
              ['Roles', 'Role-protected farm navigation'],
              ['Data', 'Seeded animal group and daily log data'],
              ['Stock', 'Inventory, sales, and expense records'],
              ['Teams', 'Manager, employee, and accountant views'],
              ['Offline', 'Local fallback for offline demos'],
            ].map(([icon, item]) => (
              <div
                key={item}
                className="rounded-2xl p-4 transition hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,.72)', border: '1px solid var(--border)' }}
              >
                <p className="mb-2 text-caption font-bold uppercase tracking-[.08em]" style={{ color: 'var(--accent-ink)' }}>{icon}</p>
                <p style={{ margin: 0, color: 'var(--text)', fontWeight: 600 }}>{item}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm" style={{ color: 'var(--text-dim)' }}>
            Use one of the accounts on the right, or create a new operator account when Firebase email/password auth is enabled.
          </p>
        </section>

        <AuthForm mode={mode} setMode={setMode} />
      </div>
    </div>
  )
}
