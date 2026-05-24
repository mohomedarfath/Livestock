import { useMemo, useState } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useEmployees } from '../../hooks/useEmployees'
import { useEmployeeActivities } from '../../hooks/useEmployeeActivities'
import { useConfirm } from '../../components/ui'

const WAGE_COLORS = {
  hourly: { bg: '#eff6ff', color: '#2563eb', label: 'Hourly' },
  salary: { bg: '#f0fdf4', color: '#16a34a', label: 'Salary' },
  daily: { bg: '#fffbeb', color: '#d97706', label: 'Daily' },
}

const EMPTY_FORM = { name: '', role: '', wageType: 'hourly', rate: '', phone: '', notes: '' }

export default function EmployeeRoster() {
  const { fmt } = useCurrency()
  const confirm = useConfirm()
  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
    createEmployee,
    toggleEmployeeActive,
    removeEmployee,
  } = useEmployees()
  const { activities, loading: activitiesLoading, error: activitiesError } = useEmployeeActivities()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const loading = employeesLoading || activitiesLoading
  const loadError = employeesError || activitiesError

  const {
    activeEmployees,
    inactiveEmployees,
    displayedEmployees,
    hoursMap,
    tasksMap,
    totalMonthlyCost,
  } = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7)
    const monthActivities = activities.filter((activity) => String(activity.date || '').startsWith(thisMonth))
    const nextHoursMap = {}
    const nextTasksMap = {}

    monthActivities.forEach((activity) => {
      nextHoursMap[activity.employeeId] = (nextHoursMap[activity.employeeId] || 0) + (parseFloat(activity.hours) || 0)
      nextTasksMap[activity.employeeId] = (nextTasksMap[activity.employeeId] || 0) + 1
    })

    const nextActiveEmployees = employees.filter((employee) => employee.active)
    const nextInactiveEmployees = employees.filter((employee) => !employee.active)
    const nextDisplayedEmployees = showInactive ? employees : nextActiveEmployees

    const nextTotalMonthlyCost = nextActiveEmployees.reduce((sum, employee) => {
      if (employee.wageType === 'salary') return sum + (employee.rate || 0)
      const hours = nextHoursMap[employee.id] || 0
      return sum + hours * (employee.rate || 0)
    }, 0)

    return {
      activeEmployees: nextActiveEmployees,
      inactiveEmployees: nextInactiveEmployees,
      displayedEmployees: nextDisplayedEmployees,
      hoursMap: nextHoursMap,
      tasksMap: nextTasksMap,
      totalMonthlyCost: nextTotalMonthlyCost,
    }
  }, [activities, employees, showInactive])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      setFormError('Name is required')
      return
    }
    if (!form.role.trim()) {
      setFormError('Job role is required')
      return
    }
    if (!form.rate || parseFloat(form.rate) <= 0) {
      setFormError('Rate must be greater than 0')
      return
    }

    setFormError('')

    try {
      await createEmployee({
        userId: null,
        name: form.name.trim(),
        role: form.role.trim(),
        wageType: form.wageType,
        rate: parseFloat(form.rate),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        active: true,
        joinedAt: new Date().toISOString().split('T')[0],
      })

      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (error) {
      setFormError(error.message || 'Failed to save employee.')
    }
  }

  async function handleToggleActive(employeeId) {
    const employee = employees.find((entry) => entry.id === employeeId)
    if (!employee) return

    const action = employee.active ? 'deactivate' : 'reactivate'
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} employee?`,
      description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${employee.name}.`,
      confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
    })
    if (!confirmed) return

    try {
      await toggleEmployeeActive(employeeId)
    } catch (error) {
      setFormError(error.message || 'Failed to update employee status.')
    }
  }

  async function handleDeleteEmployee(employeeId) {
    const employee = employees.find((entry) => entry.id === employeeId)
    const confirmed = await confirm({
      title: 'Delete employee?',
      description: `Permanently delete ${employee?.name || 'this employee'}? This cannot be undone.`,
      confirmLabel: 'Delete employee',
      destructive: true,
    })
    if (!confirmed) return

    try {
      await removeEmployee(employeeId)
    } catch (error) {
      setFormError(error.message || 'Failed to delete employee.')
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-10">
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading employees...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Employee Roster</h2>
        <div className="flex gap-2">
          {inactiveEmployees.length > 0 && (
            <button
              onClick={() => setShowInactive((value) => !value)}
              className="btn-secondary text-sm"
            >
              {showInactive ? 'Hide Inactive' : `Show Inactive (${inactiveEmployees.length})`}
            </button>
          )}
          <button onClick={() => setShowForm((value) => !value)} className="btn-primary text-sm">
            {showForm ? 'Cancel' : '+ Add Employee'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="card" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Active Staff</p>
          <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 700, color: 'var(--text)' }}>{activeEmployees.length}</p>
        </div>
        <div className="card text-center">
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Hours This Month</p>
          <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 700, color: 'var(--text)' }}>
            {Object.values(hoursMap).reduce((sum, hours) => sum + hours, 0).toFixed(0)}h
          </p>
        </div>
        <div className="card text-center">
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Est. Monthly Cost</p>
          <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>{fmt(totalMonthlyCost.toFixed(0))}</p>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>New Employee</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Full Name *</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="input-field" placeholder="e.g. John Worker" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Job Role *</label>
                <input value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="input-field" placeholder="e.g. Farm Hand, Egg Collector" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Wage Type *</label>
                <select value={form.wageType} onChange={(event) => setForm((current) => ({ ...current, wageType: event.target.value }))} className="input-field">
                  <option value="hourly">Hourly</option>
                  <option value="salary">Monthly Salary</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Rate ({form.wageType === 'salary' ? '/month' : form.wageType === 'daily' ? '/day' : '/hour'}) *
                </label>
                <input type="number" min="0" step="0.01" value={form.rate} onChange={(event) => setForm((current) => ({ ...current, rate: event.target.value }))} className="input-field" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Phone (optional)</label>
                <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="input-field" placeholder="+91 9999 9999" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Notes (optional)</label>
                <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="input-field" placeholder="Any notes" />
              </div>
            </div>
            {formError && (
              <p className="text-red-600 text-sm mt-3">{formError}</p>
            )}
            <button type="submit" className="btn-primary mt-4">Save Employee</button>
          </form>
        </div>
      )}

      {displayedEmployees.length === 0 ? (
        <div className="card text-center py-10">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No employees yet. Add your first employee above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedEmployees.map((employee) => {
            const wageColor = WAGE_COLORS[employee.wageType] || WAGE_COLORS.hourly
            const hours = hoursMap[employee.id] || 0
            const tasks = tasksMap[employee.id] || 0
            const estimatedCost = employee.wageType === 'salary' ? employee.rate : hours * employee.rate

            return (
              <div
                key={employee.id}
                className="card"
                style={{ opacity: employee.active ? 1 : 0.6, border: '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: employee.active ? 'var(--accent)' : 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: employee.active ? '#fff' : 'var(--text-dim)',
                    fontWeight: 700,
                    fontSize: '16px',
                    flexShrink: 0,
                  }}>
                    {employee.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{employee.name}</p>
                      {!employee.active && (
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '99px', background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '2px 0 6px', fontSize: '12px', color: 'var(--text-muted)' }}>{employee.role}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: wageColor.bg, color: wageColor.color, fontWeight: 500 }}>
                        {wageColor.label} · {fmt(employee.rate)}{employee.wageType === 'salary' ? '/mo' : employee.wageType === 'daily' ? '/day' : '/hr'}
                      </span>
                      {employee.joinedAt && (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          Joined {new Date(`${employee.joinedAt}T00:00:00`).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                    {employee.phone && (
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-dim)' }}>{employee.phone}</p>
                    )}
                  </div>
                </div>

                {employee.active && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-dim)' }}>This Month</p>
                      <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{hours.toFixed(1)}h</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-dim)' }}>Tasks</p>
                      <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{tasks}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-dim)' }}>Est. Cost</p>
                      <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{fmt(estimatedCost.toFixed(0))}</p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleToggleActive(employee.id)}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }}
                  >
                    {employee.active ? 'Pause' : 'Reactivate'}
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
