import { useMemo } from 'react'
import SmartSuggestions from '../../components/SmartSuggestions'
import StatCard from '../../components/StatCard'
import WeatherWidget from '../../components/WeatherWidget'
import { EggProductionChart, TasksChart } from '../../components/FarmCharts'
import { useOrganizationSettings } from '../../hooks/useOrganizationSettings'
import { useEmployees } from '../../hooks/useEmployees'
import { useFlocks } from '../../hooks/useFlocks'
import { useEmployeeActivities } from '../../hooks/useEmployeeActivities'

export default function ManagerDashboard({ onNavigate }) {
  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const { settings } = useOrganizationSettings()
  const { employees, loading: employeesLoading, error: employeesError } = useEmployees()
  const { flocks, loading: flocksLoading, error: flocksError } = useFlocks()
  const { activities, loading: activitiesLoading, error: activitiesError } = useEmployeeActivities()

  const loading = employeesLoading || flocksLoading || activitiesLoading
  const loadError = employeesError || flocksError || activitiesError

  const data = useMemo(() => {
    const activeEmployees = employees.filter((employee) => employee.active)
    const todayActivities = activities.filter((activity) => activity.date === today)
    const totalHoursToday = todayActivities.reduce((sum, activity) => sum + (parseFloat(activity.hours) || 0), 0)

    const employeeSummary = activeEmployees.map((employee) => {
      const employeeActivities = todayActivities.filter((activity) => activity.employeeId === employee.id)
      const hoursWorked = employeeActivities.reduce((sum, activity) => sum + (parseFloat(activity.hours) || 0), 0)
      const lastActivity = [...employeeActivities].sort((left, right) => String(right.time || '').localeCompare(String(left.time || '')))[0]
      return {
        ...employee,
        hoursToday: hoursWorked,
        tasksToday: employeeActivities.length,
        lastActivity: lastActivity ? `${lastActivity.taskType} at ${lastActivity.time || '-'}` : null,
        noShow: employeeActivities.length === 0,
      }
    })

    const flockAssignments = flocks.map((flock) => {
      const flockActivities = todayActivities.filter((activity) => activity.flockId === flock.id || activity.flockName === flock.name)
      const employeeIds = [...new Set(flockActivities.map((activity) => activity.employeeId))]
      const employeeNames = employeeIds.map((employeeId) => activeEmployees.find((employee) => employee.id === employeeId)?.name).filter(Boolean)
      return { ...flock, workersToday: employeeNames }
    })

    return {
      activeEmployees: activeEmployees.length,
      todayActivities: todayActivities.length,
      totalHoursToday: totalHoursToday.toFixed(1),
      activeFlocksCount: flocks.length,
      employeeSummary,
      flockAssignments,
    }
  }, [activities, employees, flocks, today])

  if (loading) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading manager dashboard...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{greeting}</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            {settings.farmName || 'Your Farm'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onNavigate('activities')} className="btn-secondary" style={{ fontSize: '13px' }}>
            View All Activities
          </button>
          <button onClick={() => onNavigate('daily-log')} className="btn-primary" style={{ fontSize: '13px' }}>
            + Log Work
          </button>
        </div>
      </div>

      {loadError && (
        <div className="card" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
          {loadError}
        </div>
      )}

      <SmartSuggestions role="manager" onNavigate={onNavigate} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }} className="lg:grid-cols-4">
        {[
          { label: 'Workers Active', value: data.activeEmployees, tone: 'blue', icon: 'W' },
          { label: "Today's Tasks", value: data.todayActivities, tone: 'green', icon: 'T' },
          { label: 'Hours Worked', value: `${data.totalHoursToday}h`, tone: 'amber', icon: 'H' },
          { label: 'Flocks', value: data.activeFlocksCount, tone: 'orange', icon: 'F' },
        ].map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
            Worker Status - Today
          </h2>
          <button onClick={() => onNavigate('activities')} style={{ fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            See all
          </button>
        </div>

        {data.employeeSummary.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px' }}>No employees in roster yet.</p>
            <button onClick={() => onNavigate('employees-roster')} className="btn-primary">Add Employee</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1px', background: 'var(--border)' }}>
            {data.employeeSummary.map((employee) => (
              <div
                key={employee.id}
                style={{
                  padding: '16px',
                  background: employee.noShow ? '#fef2f2' : 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: employee.noShow ? '#fee2e2' : 'var(--accent-bg)',
                    color: employee.noShow ? '#dc2626' : 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}>
                    {employee.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: employee.noShow ? '#dc2626' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {employee.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>{employee.role}</p>
                  </div>
                </div>
                {employee.noShow ? (
                  <span style={{ fontSize: '11px', background: '#fecaca', color: '#dc2626', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, display: 'inline-block', width: 'fit-content' }}>
                    No work logged yet
                  </span>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '12px', background: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      {employee.hoursToday.toFixed(1)}h
                    </span>
                    <span style={{ fontSize: '12px', background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '6px' }}>
                      {employee.tasksToday} task{employee.tasksToday !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {employee.lastActivity && (
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Last: {employee.lastActivity}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <EggProductionChart />
        <TasksChart />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="lg:grid-cols-2">
        <div className="card">
          <h2 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
            Flock Coverage Today
          </h2>
          {data.flockAssignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px' }}>No flocks configured.</p>
              <button onClick={() => onNavigate('flocks')} className="btn-primary" style={{ fontSize: '13px' }}>Add Flock</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.flockAssignments.map((flock) => (
                <div key={flock.id} style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{flock.name}</p>
                    {flock.workersToday.length === 0 && (
                      <span style={{ fontSize: '11px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                        No workers today
                      </span>
                    )}
                  </div>
                  {flock.workersToday.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {flock.workersToday.map((name) => (
                        <span key={name} style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '99px' }}>{name}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>Assign a worker to this flock today.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <WeatherWidget />
      </div>
    </div>
  )
}
