import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTenant } from '../context/TenantContext'

export default function OnboardingPage() {
  const location = useLocation()
  const { createOrganization, error } = useTenant()
  const [farmName, setFarmName] = useState(() => location.state?.farmName || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!farmName.trim()) return

    setLoading(true)
    setMessage('')
    try {
      await createOrganization(farmName.trim())
    } catch (err) {
      setMessage(err.message || 'Failed to create workspace.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="card w-full max-w-lg">
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          SaaS onboarding
        </p>
        <h1 style={{ margin: '8px 0 0', color: 'var(--text)', fontSize: '26px', fontWeight: 700 }}>
          Create your first farm workspace
        </h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>
          This creates the tenant that owns your flocks, staff, reports, and billing plan.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Farm name
            </label>
            <input
              className="input-field"
              placeholder="Green Valley Poultry"
              value={farmName}
              onChange={(event) => setFarmName(event.target.value)}
            />
          </div>
          {(message || error) && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
              {message || error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating workspace...' : 'Create workspace'}
          </button>
        </form>
      </div>
    </div>
  )
}
