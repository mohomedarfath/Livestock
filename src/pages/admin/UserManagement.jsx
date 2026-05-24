import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { useUsers } from '../../hooks/useUsers'
import { isLegacyUserManagementEnabled } from '../../services/repositories/userRepository'
import { validateUser } from '../../utils/validation'
import { APP_MODULES } from '../../app/modules'
import { platformRepository } from '../../services/repositories/platformRepository'

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  employee: 'bg-green-100 text-green-800',
  accountant: 'bg-amber-100 text-amber-800',
}

const MODULE_GROUP_ORDER = ['Farm Operations', 'Health & Feed', 'Inventory', 'Finance', 'People', 'Administration']
const EMPTY_USER_FORM = { name: '', email: '', password: '', role: 'employee' }
const EMPTY_ROLE_FORM = {
  key: '',
  name: '',
  description: '',
  baseRole: 'employee',
  moduleIds: [],
}

function slugifyRole(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export default function UserManagement() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { currentOrganization, currentRole, roleDefinitions, memberships } = useTenant()
  const { users, loading, error, saveUser, toggleUserActive } = useUsers()

  const [activeTab, setActiveTab] = useState('users')
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM)
  const [roleForm, setRoleForm] = useState(EMPTY_ROLE_FORM)
  const [editingRoleKey, setEditingRoleKey] = useState('')
  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')

  const availableRoleOptions = roleDefinitions.map((role) => ({
    value: role.key,
    label: role.name,
  }))

  const groupedModules = useMemo(
    () =>
      MODULE_GROUP_ORDER.map((group) => ({
        group,
        modules: APP_MODULES.filter((module) => module.group === group),
      })).filter((entry) => entry.modules.length > 0),
    []
  )

  const tenantSummary = useMemo(
    () => ({
      activeUsers: users.filter((entry) => entry.active).length,
      totalRoles: roleDefinitions.length,
      totalMemberships: memberships.filter((membership) => membership.organization_id === currentOrganization?.id).length,
    }),
    [currentOrganization?.id, memberships, roleDefinitions.length, users]
  )

  if (!isLegacyUserManagementEnabled) {
    return (
      <div className="space-y-5">
        <div className="card space-y-3">
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Farm admin console
          </p>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>
            {currentOrganization?.name || 'Farm workspace'} admin
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            User invites and role editing are disabled in Supabase mode until tenant users and role permissions are backed by real server-side flows.
          </p>
          <div
            className="rounded-2xl px-4 py-4 text-sm"
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
            }}
          >
            This prevents browser-only demo changes from looking like production user management.
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Current role', value: currentRole || 'unknown' },
              { label: 'Memberships', value: tenantSummary.totalMemberships },
              { label: 'Visible roles', value: tenantSummary.totalRoles },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface-2)' }}>
                <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '12px' }}>{stat.label}</p>
                <p style={{ margin: '6px 0 0', color: 'var(--text)', fontSize: '22px', fontWeight: 800 }}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/app/settings')} className="btn-primary">
              Open Farm Settings
            </button>
          </div>
        </div>
      </div>
    )
  }

  function resetUserForm() {
    setUserForm(EMPTY_USER_FORM)
    setEditingId(null)
    setShowUserForm(false)
  }

  function resetRoleForm() {
    setRoleForm(EMPTY_ROLE_FORM)
    setEditingRoleKey('')
  }

  function clearFeedback() {
    setErrors({})
    setSuccessMsg('')
  }

  async function handleUserSubmit(event) {
    event.preventDefault()
    const nextErrors = validateUser(userForm, users, editingId)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    try {
      await saveUser(
        {
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          ...(userForm.password.trim() ? { password: userForm.password.trim() } : {}),
        },
        editingId
      )
      resetUserForm()
      setErrors({})
      setSuccessMsg(editingId ? 'Farm user updated successfully.' : 'Farm user invited successfully.')
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save user.' })
    }
  }

  async function handleToggleActive(userId) {
    if (userId === currentUser.id) return
    try {
      await toggleUserActive(userId)
      setSuccessMsg('Farm user access updated.')
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to update user access.' })
    }
  }

  function startEditUser(user) {
    clearFeedback()
    setEditingId(user.id)
    setUserForm({ name: user.name, email: user.email, password: '', role: user.role })
    setShowUserForm(true)
  }

  function startEditRole(role) {
    clearFeedback()
    setEditingRoleKey(role.key)
    setRoleForm({
      key: role.key,
      name: role.name,
      description: role.description || '',
      baseRole: role.baseRole || 'employee',
      moduleIds: role.moduleIds || [],
    })
    setActiveTab('roles')
  }

  async function handleRoleSubmit(event) {
    event.preventDefault()

    if (!roleForm.name.trim()) {
      setErrors({ role: 'Role name is required.' })
      return
    }

    const nextKey = editingRoleKey || slugifyRole(roleForm.key || roleForm.name)
    if (!nextKey) {
      setErrors({ role: 'Role key could not be generated.' })
      return
    }

    try {
      await platformRepository.upsertRoleDefinition(currentOrganization.id, {
        key: nextKey,
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        baseRole: roleForm.baseRole,
        moduleIds: roleForm.moduleIds,
        isSystem: roleDefinitions.some((role) => role.key === nextKey && role.isSystem),
      })
      resetRoleForm()
      setErrors({})
      setSuccessMsg('Role permissions updated.')
    } catch (err) {
      setErrors({ role: err.message || 'Failed to save role permissions.' })
    }
  }

  async function handleDeleteRole(roleKey) {
    try {
      await platformRepository.deleteRoleDefinition(currentOrganization.id, roleKey)
      if (editingRoleKey === roleKey) resetRoleForm()
      setSuccessMsg('Custom role removed and affected users moved to Employee.')
    } catch (err) {
      setErrors({ role: err.message || 'Failed to delete role.' })
    }
  }

  function toggleModule(moduleId) {
    setRoleForm((current) => ({
      ...current,
      moduleIds: current.moduleIds.includes(moduleId)
        ? current.moduleIds.filter((entry) => entry !== moduleId)
        : [...current.moduleIds, moduleId],
    }))
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Farm admin console
          </p>
          <h2 style={{ margin: '6px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>
            {currentOrganization?.name || 'Farm workspace'} admin
          </h2>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>
            Invite users, assign farm roles, customize module access, and manage this tenant independently.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Active users', value: tenantSummary.activeUsers },
            { label: 'Roles', value: tenantSummary.totalRoles },
            { label: 'Memberships', value: tenantSummary.totalMemberships },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface-2)' }}>
              <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '12px' }}>{stat.label}</p>
              <p style={{ margin: '6px 0 0', color: 'var(--text)', fontSize: '22px', fontWeight: 800 }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {(successMsg || error || errors.submit || errors.role) && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: successMsg ? '#f0fdf4' : '#fef2f2',
            color: successMsg ? '#15803d' : '#dc2626',
            border: `1px solid ${successMsg ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {successMsg || errors.submit || errors.role || error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'users', label: 'Users' },
          { id: 'roles', label: 'Roles & Access' },
          { id: 'organization', label: 'Organization' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              clearFeedback()
              setActiveTab(tab.id)
            }}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: activeTab === tab.id ? 'var(--accent)' : 'var(--surface)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              border: activeTab === tab.id ? '1px solid transparent' : '1px solid var(--border)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text)]">Tenant users</h3>
            {!showUserForm && (
              <button
                onClick={() => {
                  clearFeedback()
                  setShowUserForm(true)
                  setEditingId(null)
                  setUserForm(EMPTY_USER_FORM)
                }}
                className="btn-primary text-sm"
              >
                + Invite User
              </button>
            )}
          </div>

          {showUserForm && (
            <div className="card border border-farm-orange border-opacity-40">
              <h3 className="text-base font-semibold text-[var(--text)] mb-4">
                {editingId ? 'Edit farm user' : 'Invite farm user'}
              </h3>
              <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">Full Name *</label>
                  <input className="input-field" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} placeholder="Amina Perera" />
                  {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">Email *</label>
                  <input className="input-field" type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} placeholder="user@farm.com" />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">
                    Password {editingId && <span className="text-[var(--text-dim)] font-normal">(leave blank to keep current)</span>}
                  </label>
                  <input className="input-field" type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} placeholder="temporary password" />
                  {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">Role *</label>
                  <select className="input-field" value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                    {availableRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && <p className="text-red-600 text-xs mt-1">{errors.role}</p>}
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Send Invite'}</button>
                  <button type="button" onClick={resetUserForm} className="btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center text-[var(--text-dim)] py-8">Loading farm users...</td>
                    </tr>
                  ) : users.map((user) => (
                    <tr key={user.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-farm-orange flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-[var(--text)]">{user.name}</span>
                          {user.id === currentUser.id && (
                            <span className="text-xs bg-[var(--surface-2)] text-[var(--text)] px-1.5 py-0.5 rounded font-medium">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role] || 'bg-[var(--surface-2)] text-[var(--text)]'}`}>
                          {roleDefinitions.find((role) => role.key === user.role)?.name || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.active ? 'bg-green-100 text-green-800' : 'bg-[var(--surface-2)] text-[var(--text-dim)]'}`}>
                          {user.active ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => startEditUser(user)} className="text-xs px-2.5 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg transition-colors font-medium">
                            Edit
                          </button>
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleToggleActive(user.id)}
                              className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                                user.active
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {user.active ? 'Revoke Access' : 'Restore Access'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && users.length === 0 && (
                <p className="text-center text-[var(--text-dim)] py-8">No farm users found yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid gap-5 xl:grid-cols-[.85fr,1.15fr]">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '18px', fontWeight: 700 }}>Farm roles</h3>
                <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Default roles can be tuned per farm, and custom roles can inherit a base dashboard experience.
                </p>
              </div>
              <button
                onClick={() => {
                  clearFeedback()
                  resetRoleForm()
                }}
                className="btn-secondary text-sm"
              >
                New Custom Role
              </button>
            </div>

            <div className="space-y-3">
              {roleDefinitions.map((role) => (
                <div key={role.key} className="rounded-2xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p style={{ margin: 0, color: 'var(--text)', fontWeight: 700 }}>
                        {role.name}
                        {role.isSystem && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>System</span>}
                      </p>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {role.description || 'No description yet.'}
                      </p>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-dim)', fontSize: '12px' }}>
                        Base dashboard: {role.baseRole}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditRole(role)} className="text-xs px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-medium">
                        Edit access
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => handleDeleteRole(role.key)} className="text-xs px-2.5 py-1 bg-red-100 text-red-800 rounded-lg font-medium">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {role.moduleIds.slice(0, 8).map((moduleId) => (
                      <span key={moduleId} className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                        {APP_MODULES.find((module) => module.id === moduleId)?.label || moduleId}
                      </span>
                    ))}
                    {role.moduleIds.length > 8 && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                        +{role.moduleIds.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleRoleSubmit} className="card space-y-4">
            <div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '18px', fontWeight: 700 }}>
                {editingRoleKey ? 'Edit role access' : 'Create custom role'}
              </h3>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                Role changes apply immediately in the current session, including navigation and route access.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Role name</label>
                <input className="input-field" value={roleForm.name} onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })} placeholder="Supervisor" />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Role key</label>
                <input
                  className="input-field"
                  value={editingRoleKey ? editingRoleKey : roleForm.key}
                  disabled={Boolean(editingRoleKey)}
                  onChange={(event) => setRoleForm({ ...roleForm, key: slugifyRole(event.target.value) })}
                  placeholder="supervisor"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Base dashboard</label>
                <select className="input-field" value={roleForm.baseRole} onChange={(event) => setRoleForm({ ...roleForm, baseRole: event.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
                <input className="input-field" value={roleForm.description} onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })} placeholder="Runs day-to-day operations." />
              </div>
            </div>

            <div className="space-y-4">
              {groupedModules.map(({ group, modules }) => (
                <div key={group} className="rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
                  <p style={{ margin: 0, color: 'var(--text)', fontWeight: 700 }}>{group}</p>
                  <div className="grid gap-2 sm:grid-cols-2 mt-3">
                    {modules.map((module) => (
                      <label
                        key={module.id}
                        className="flex items-center gap-3 rounded-xl px-3 py-2"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        <input
                          type="checkbox"
                          checked={roleForm.moduleIds.includes(module.id)}
                          onChange={() => toggleModule(module.id)}
                        />
                        <span>{module.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingRoleKey ? 'Save Access' : 'Create Role'}
              </button>
              <button type="button" onClick={resetRoleForm} className="btn-secondary">
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'organization' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card space-y-4">
            <div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '18px', fontWeight: 700 }}>Tenant summary</h3>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                This farm workspace is isolated from every other tenant in the platform.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Farm name', value: currentOrganization?.name || 'Not set' },
                { label: 'Workspace slug', value: currentOrganization?.slug || 'Not set' },
                { label: 'Subscription plan', value: currentOrganization?.plan || 'starter' },
                { label: 'Current role', value: currentRole || 'unknown' },
              ].map((entry) => (
                <div key={entry.label} className="rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
                  <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '12px' }}>{entry.label}</p>
                  <p style={{ margin: '8px 0 0', color: 'var(--text)', fontWeight: 700 }}>{entry.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '18px', fontWeight: 700 }}>Organization actions</h3>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                Update farm identity, logo, currency, and address from the tenant settings page.
              </p>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
              <p style={{ margin: 0, color: 'var(--text)', fontWeight: 700 }}>Settings are tenant-scoped</p>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                Changes made in Farm Settings only affect {currentOrganization?.name || 'this workspace'} and not any other farm on the platform.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => navigate('/app/settings')} className="btn-primary">
                Open Farm Settings
              </button>
              <button onClick={() => setActiveTab('users')} className="btn-secondary">
                Manage Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
