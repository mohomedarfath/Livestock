import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { isFirebaseConfigured } from '../../lib/env'
import { platformAdminRepository } from '../../services/repositories/platformAdminRepository'

const EMPTY_FORM = {
  name: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  plan: 'starter',
  billing_status: 'trialing',
}

const PLAN_STYLES = {
  starter: { bg: '#eff6ff', color: '#2563eb' },
  growth: { bg: '#ecfdf5', color: '#059669' },
  enterprise: { bg: '#f5f3ff', color: '#7c3aed' },
}

const BILLING_STYLES = {
  active: { bg: '#f0fdf4', color: '#15803d' },
  trialing: { bg: '#eff6ff', color: '#2563eb' },
  past_due: { bg: '#fef2f2', color: '#dc2626' },
  paused: { bg: '#fff7ed', color: '#c2410c' },
}

export default function PlatformDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isImpersonating, stopImpersonation, startImpersonation } = useTenant()
  const [overview, setOverview] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  async function loadOverview() {
    setLoading(true)
    try {
      const nextOverview = await platformAdminRepository.getPlatformOverview()
      setOverview(nextOverview)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [])

  useEffect(() => {
    const handleUpdate = () => loadOverview()
    window.addEventListener('clucktrack:tenant-access-updated', handleUpdate)
    return () => window.removeEventListener('clucktrack:tenant-access-updated', handleUpdate)
  }, [])

  const stats = useMemo(() => {
    return {
      farms: overview.length,
      activeSubscriptions: overview.filter((tenant) => tenant.billing_status === 'active').length,
      trialing: overview.filter((tenant) => tenant.billing_status === 'trialing').length,
      revenue: overview.reduce((sum, tenant) => sum + (Number(tenant.monthlyRevenue) || 0), 0),
      users: overview.reduce((sum, tenant) => sum + (tenant.userCount || 0), 0),
    }
  }, [overview])

  async function handleCreateTenant(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.ownerName.trim() || !form.ownerEmail.trim() || (!isFirebaseConfigured && !form.ownerPassword.trim())) {
      setMessage(
        isFirebaseConfigured
          ? 'Fill in the tenant name and owner contact details.'
          : 'Fill in the tenant name, owner details, and a starter password.'
      )
      return
    }

    setSubmitting(true)
    try {
      const created = await platformAdminRepository.createOrganization({
        name: form.name.trim(),
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim(),
        ownerPassword: form.ownerPassword.trim(),
        plan: form.plan,
        billing_status: form.billing_status,
      })
      setForm(EMPTY_FORM)
      setMessage(
        created.ownerAssignment === 'linked'
          ? 'New farm tenant created and linked to the existing owner account.'
          : 'New farm tenant created. The owner email was saved, but that user must sign up before access can be linked.'
      )
      await loadOverview()
    } catch (error) {
      setMessage(error.message || 'Failed to create farm tenant.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBillingChange(tenant, billing_status) {
    await platformAdminRepository.updateSubscription(tenant.id, { billing_status })
    setMessage(`${tenant.name} subscription updated to ${billing_status}.`)
    await loadOverview()
  }

  async function handleImpersonate(tenantId) {
    await startImpersonation(tenantId, 'admin')
    navigate('/app')
  }

  async function handleStopImpersonation() {
    await stopImpersonation()
    setMessage('Support impersonation ended.')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Platform control
            </p>
            <h1 style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--text)' }}>
              CluckTrack super admin
            </h1>
            <p style={{ margin: '10px 0 0', color: 'var(--text-muted)', maxWidth: '52ch' }}>
              Manage farm tenants, subscription health, support access, and cross-farm usage from one control plane.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isImpersonating && (
              <button onClick={handleStopImpersonation} className="btn-secondary">
                Exit Impersonation
              </button>
            )}
            <button
              onClick={() => {
                if (!isImpersonating) {
                  setMessage('Choose a farm to impersonate before opening a workspace.')
                  return
                }
                navigate('/app')
              }}
              className="btn-secondary"
            >
              Open Farm Workspace
            </button>
            <button onClick={logout} className="btn-secondary">
              Sign out
            </button>
          </div>
        </div>

        {message && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Farm tenants', value: stats.farms, sub: 'Total organizations' },
            { label: 'Active subscriptions', value: stats.activeSubscriptions, sub: 'Paying farms' },
            { label: 'Trials', value: stats.trialing, sub: 'Still onboarding' },
            { label: 'Active users', value: stats.users, sub: 'Across all farms' },
            { label: 'Revenue tracked', value: stats.revenue.toLocaleString(), sub: 'Demo usage total' },
          ].map((card) => (
            <div key={card.label} className="card">
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {card.label}
              </p>
              <p style={{ margin: '10px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--text)' }}>{card.value}</p>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr,.8fr]">
          <div className="card overflow-hidden p-0">
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 style={{ margin: 0, color: 'var(--text)', fontSize: '18px', fontWeight: 700 }}>Farm tenants</h2>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                Activate, pause, monitor, and impersonate tenant workspaces for support.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Farm</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Plan</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Subscription</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Usage</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-dim)]">
                        Loading platform overview...
                      </td>
                    </tr>
                  ) : (
                    overview.map((tenant) => {
                      const planStyle = PLAN_STYLES[tenant.plan] || PLAN_STYLES.starter
                      const billingStyle = BILLING_STYLES[tenant.billing_status] || BILLING_STYLES.active

                      return (
                        <tr key={tenant.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <td className="px-4 py-3 align-top">
                            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>{tenant.name}</p>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{tenant.slug}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
                              Support tier: {tenant.supportTier}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: planStyle.bg, color: planStyle.color }}>
                              {tenant.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top space-y-2">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold" style={{ background: billingStyle.bg, color: billingStyle.color }}>
                              {tenant.billing_status}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {['active', 'trialing', 'past_due', 'paused'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleBillingChange(tenant, status)}
                                  className="text-xs px-2.5 py-1 rounded-lg"
                                  style={{
                                    border: '1px solid var(--border)',
                                    color: tenant.billing_status === status ? '#fff' : 'var(--text-muted)',
                                    background: tenant.billing_status === status ? 'var(--accent)' : 'transparent',
                                  }}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <p style={{ margin: 0, color: 'var(--text)', fontWeight: 600 }}>{tenant.userCount} active users</p>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{tenant.flockCount} flocks</p>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>Revenue: {tenant.monthlyRevenue.toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => handleImpersonate(tenant.id)} className="btn-primary text-sm">
                                Impersonate
                              </button>
                              <button
                                onClick={async () => {
                                  await startImpersonation(tenant.id, 'admin')
                                  navigate('/app/settings')
                                }}
                                className="btn-secondary text-sm"
                              >
                                Open Settings
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card space-y-4">
            <div>
              <h2 style={{ margin: 0, color: 'var(--text)', fontSize: '18px', fontWeight: 700 }}>Create farm tenant</h2>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                Provision a new farm, seed a workspace, and assign an owner account in one step.
              </p>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Farm name</label>
                <input className="input-field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Owner name</label>
                <input className="input-field" value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Owner email</label>
                <input className="input-field" type="email" value={form.ownerEmail} onChange={(event) => setForm({ ...form, ownerEmail: event.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Starter password</label>
                <input
                  className="input-field"
                  type="password"
                  value={form.ownerPassword}
                  disabled={isFirebaseConfigured}
                  placeholder={isFirebaseConfigured ? 'Handled by user sign-up' : ''}
                  onChange={(event) => setForm({ ...form, ownerPassword: event.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Plan</label>
                  <select className="input-field" value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })}>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Subscription</label>
                  <select className="input-field" value={form.billing_status} onChange={(event) => setForm({ ...form, billing_status: event.target.value })}>
                    <option value="trialing">Trialing</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past due</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? 'Creating tenant...' : 'Create tenant'}
              </button>
            </form>

            <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{user?.name}</p>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                Platform owner access. Use impersonation when a farm needs hands-on support.
              </p>
              {isFirebaseConfigured && (
                <p style={{ margin: '8px 0 0', color: 'var(--text-dim)', fontSize: '12px' }}>
                  Firebase mode can create organizations and link existing user accounts, but it cannot create owner credentials from the browser.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
