import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/auth/authService'

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 24%, transparent), transparent 36%), var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  panel: {
    width: '100%',
    maxWidth: '520px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 20px 60px var(--shadow-color)',
  },
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { authMode, completePasswordReset } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [email, setEmail] = useState('')

  const oobCode = searchParams.get('oobCode') || ''

  useEffect(() => {
    let ignore = false

    async function verifyResetLink() {
      if (authMode !== 'firebase') {
        setVerifying(false)
        return
      }

      if (!oobCode) {
        if (!ignore) {
          setError('This password reset link is missing or invalid. Request a new reset email and try again.')
          setVerifying(false)
        }
        return
      }

      const result = await authService.validatePasswordResetCode(oobCode)

      if (ignore) return

      if (!result.success) {
        setError(result.error || 'This password reset link is no longer valid.')
      } else {
        setEmail(result.email || '')
      }

      setVerifying(false)
    }

    verifyResetLink()

    return () => {
      ignore = true
    }
  }, [authMode, oobCode])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.trim().length < 8) {
      setError('Use at least 8 characters for the new password.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await completePasswordReset(oobCode, password)
    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to update password.')
      return
    }

    setMessage('Password updated successfully. Redirecting to sign in...')
    setTimeout(() => navigate('/auth', { replace: true }), 1200)
  }

  return (
    <div style={styles.page}>
      <div style={styles.panel}>
        <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-dim)' }}>
          Account recovery
        </p>
        <h1 style={{ margin: '8px 0 0', fontSize: '30px', fontWeight: 800, color: 'var(--text)' }}>
          Set a new password
        </h1>
        <p style={{ margin: '12px 0 0', color: 'var(--text-muted)' }}>
          Use the password reset link from your email, then choose a new password for your workspace account.
        </p>

        {email && (
          <p style={{ margin: '12px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Resetting password for <strong style={{ color: 'var(--text)' }}>{email}</strong>
          </p>
        )}

        {authMode !== 'firebase' && (
          <div className="rounded-xl px-4 py-3 text-sm mt-5" style={{ background: '#fffbeb', color: '#92400e' }}>
            Password recovery is only available when Firebase auth is configured.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              New password
            </label>
            <input
              className="input-field"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a secure password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Confirm password
            </label>
            <input
              className="input-field"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
            />
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#f0fdf4', color: '#166534' }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || verifying || authMode !== 'firebase' || !oobCode}
          >
            {verifying ? 'Checking reset link...' : loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>

        <p className="mt-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/auth" style={{ color: 'var(--accent)' }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
