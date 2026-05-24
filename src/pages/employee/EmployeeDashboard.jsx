import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useEmployees } from '../../hooks/useEmployees'
import { useEmployeeActivities } from '../../hooks/useEmployeeActivities'

const TASK_ICON = {
  Feeding: 'Feed',
  Cleaning: 'Clean',
  'Health Check': 'Health',
  'Egg Collection': 'Eggs',
  Medication: 'Meds',
  Vaccination: 'Vax',
  Maintenance: 'Fix',
}

const TASK_BADGE = {
  Feeding: { bg: 'color-mix(in srgb, #d97706 15%, var(--surface))', color: '#d97706' },
  Cleaning: { bg: 'color-mix(in srgb, #3b82f6 15%, var(--surface))', color: '#3b82f6' },
  'Health Check': { bg: 'color-mix(in srgb, #ef4444 15%, var(--surface))', color: '#ef4444' },
  'Egg Collection': { bg: 'color-mix(in srgb, #ea580c 15%, var(--surface))', color: '#ea580c' },
  Medication: { bg: 'color-mix(in srgb, #8b5cf6 15%, var(--surface))', color: '#8b5cf6' },
  Vaccination: { bg: 'color-mix(in srgb, #d946ef 15%, var(--surface))', color: '#d946ef' },
  Maintenance: { bg: 'color-mix(in srgb, #6b7280 15%, var(--surface))', color: '#6b7280' },
}

const STAT_CFG = [
  { key: 'todayActivities', label: 'Activities Today', color: '#2563eb' },
  { key: 'hoursToday', label: 'Hours Today', color: '#16a34a', suffix: 'h' },
  { key: 'hoursWeek', label: 'Hours This Week', color: '#ca8a04', suffix: 'h' },
  { key: 'tasksMonth', label: 'Tasks This Month', color: '#7c3aed' },
]

export default function EmployeeDashboard({ onNavigate }) {
  const { user } = useAuth()
  const { employees, loading: employeesLoading, error: employeesError } = useEmployees()
  const { activities, loading: activitiesLoading, error: activitiesError } = useEmployeeActivities()
  const today = new Date().toISOString().split('T')[0]

  const loading = employeesLoading || activitiesLoading
  const loadError = employeesError || activitiesError

  const { employee, stats, todayActivities } = useMemo(() => {
    const match = employees.find((entry) => entry.userId === user.id)
    if (!match) return { employee: null, stats: null, todayActivities: [] }

    const myActivities = activities.filter((activity) => activity.employeeId === match.id)
    const todayRecords = myActivities
      .filter((activity) => activity.date === today)
      .sort((left, right) => String(right.time || '').localeCompare(String(left.time || '')))
    const hoursToday = todayRecords.reduce((sum, activity) => sum + (parseFloat(activity.hours) || 0), 0)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartString = weekStart.toISOString().split('T')[0]
    const hoursWeek = myActivities
      .filter((activity) => activity.date >= weekStartString)
      .reduce((sum, activity) => sum + (parseFloat(activity.hours) || 0), 0)

    const tasksMonth = myActivities.filter((activity) => String(activity.date || '').startsWith(today.slice(0, 7))).length

    return {
      employee: match,
      stats: {
        todayActivities: todayRecords.length,
        hoursToday: hoursToday.toFixed(1),
        hoursWeek: hoursWeek.toFixed(1),
        tasksMonth,
      },
      todayActivities: todayRecords,
    }
  }, [activities, employees, today, user.id])

  if (loading) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading employee dashboard...</p>
      </div>
    )
  }

  if (!employee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#3d3830', margin: '0 0 8px' }}>Profile Not Set Up</h2>
        <p style={{ fontSize: '13px', color: '#6b6560', maxWidth: '320px', margin: 0 }}>
          Contact your manager to set up your employee profile before logging activities.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {loadError && (
        <div className="card" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
          {loadError}
        </div>
      )}

      <div className="card" style={{ background: 'linear-gradient(135deg, #c8785a 0%, #a85f44 100%)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff',
          }}>
            {employee.name.charAt(0)}
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'rgba(255,255,255,.75)' }}>Welcome back,</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>{employee.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,.75)' }}>{employee.role}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }} className="lg:grid-cols-4">
        {STAT_CFG.map((card) => (
          <div key={card.key} className="card" style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 700, color: card.color, lineHeight: 1 }}>
              {stats[card.key]}{card.suffix || ''}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>Today's Activities</h2>
            <button onClick={() => onNavigate('my-activities')} className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>
              + Log Activity
            </button>
          </div>

          {todayActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 16px' }}>No activities logged today.</p>
              <button onClick={() => onNavigate('my-activities')} className="btn-primary" style={{ fontSize: '13px' }}>
                Log Your First Activity
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayActivities.map((activity) => {
                const badge = TASK_BADGE[activity.taskType] || { bg: '#f3f4f6', color: '#374151' }
                return (
                  <div key={activity.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
                    <span style={{ fontSize: '12px', marginTop: '4px', color: '#6b7280', minWidth: '46px' }}>{TASK_ICON[activity.taskType] || 'Task'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: 500, background: badge.bg, color: badge.color }}>
                          {activity.taskType}
                        </span>
                        {activity.flockName && (
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{activity.flockName}</span>
                        )}
                        <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>{activity.time || ''}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{activity.description || '-'}</p>
                      {activity.notes && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>{activity.notes}</p>}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', flexShrink: 0 }}>{activity.hours}h</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>My Info</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['Name', employee.name],
              ['Role', employee.role],
              ['Wage Type', employee.wageType],
              ['Joined', employee.joinedAt],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{ fontWeight: 500, color: '#111827', textTransform: 'capitalize' }}>{value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('my-activities')} className="btn-primary" style={{ width: '100%', marginTop: '20px', fontSize: '13px' }}>
            Log New Activity
          </button>
        </div>
      </div>
    </div>
  )
}
