import { useMemo } from 'react'
import { Storage } from '../../utils/storage'
import SmartSuggestions from '../../components/SmartSuggestions'
import WeatherWidget from '../../components/WeatherWidget'
import {
  EggProductionChart,
  FCRTrendChart,
  FeedCostChart,
  FlockPopulationChart,
  ProfitLossBarChart,
  SalesRevenueChart,
  TasksChart,
} from '../../components/FarmCharts'
import { useOrganizationSettings } from '../../hooks/useOrganizationSettings'
import { useEmployees } from '../../hooks/useEmployees'
import { useFlocks } from '../../hooks/useFlocks'
import { useEmployeeActivities } from '../../hooks/useEmployeeActivities'
import { useAnimalType } from '../../animal/AnimalTypeContext'

function quickActions(details) {
  return [
  { label: 'Add Employee', sub: 'Hire a new worker', page: 'employees-roster', color: '#2563eb', bg: 'color-mix(in srgb, #2563eb 15%, var(--surface))' },
  { label: `Manage ${details.groupPlural}`, sub: `View and update your ${details.animalPlural.toLowerCase()}`, page: 'flocks', color: '#ea580c', bg: 'color-mix(in srgb, #ea580c 15%, var(--surface))' },
  { label: 'Daily Log', sub: "Record today's work", page: 'daily-log', color: '#16a34a', bg: 'color-mix(in srgb, #16a34a 15%, var(--surface))' },
  { label: 'Track Wages', sub: 'Pay and record wages', page: 'wages', color: '#8b5cf6', bg: 'color-mix(in srgb, #8b5cf6 15%, var(--surface))' },
  { label: 'Log Expense', sub: 'Add a cost entry', page: 'expenses', color: '#d97706', bg: 'color-mix(in srgb, #d97706 15%, var(--surface))' },
  { label: 'Profit and Loss', sub: 'See how the farm is doing', page: 'profit', color: '#0d9488', bg: 'color-mix(in srgb, #0d9488 15%, var(--surface))' },
  { label: 'Vaccinations', sub: 'Check and schedule vaccines', page: 'vaccinations', color: '#e11d48', bg: 'color-mix(in srgb, #e11d48 15%, var(--surface))' },
  { label: 'Settings', sub: 'Configure farm details', page: 'settings', color: 'var(--text)', bg: 'color-mix(in srgb, var(--text) 15%, var(--surface))' },
  ]
}

function FarmHealthBanner({ stats, details }) {
  const { score, label, color, bg, borderColor } = useMemo(() => {
    let value = 100
    if (stats.activeFlocks === 0) value -= 30
    if (stats.totalEmployees === 0) value -= 20
    if (stats.todayActivities === 0) value -= 20
    if (stats.noShowCount > 0) value -= stats.noShowCount * 10
    value = Math.max(0, value)

    if (value >= 80) return { score: value, label: 'Farm is running well', color: '#16a34a', bg: '#f0fdf4', borderColor: '#86efac' }
    if (value >= 50) return { score: value, label: 'Some things need your attention', color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a' }
    return { score: value, label: 'Farm needs immediate attention', color: '#dc2626', bg: '#fef2f2', borderColor: '#fecaca' }
  }, [stats])

  return (
    <div style={{ padding: '16px 20px', borderRadius: '12px', background: bg, border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff', border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '18px', fontWeight: 800, color }}>{score}</span>
      </div>
      <div style={{ flex: 1, minWidth: '140px' }}>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color }}>Farm Health Score</p>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color, opacity: 0.8 }}>{label}</p>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { val: stats.activeFlocks, label: details.dashboardMetric },
          { val: stats.totalEmployees, label: 'Workers' },
          { val: stats.todayActivities, label: 'Tasks Today' },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color }}>{item.val}</p>
            <p style={{ margin: 0, fontSize: '11px', color, opacity: 0.7 }}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
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

function sortActivities(left, right) {
  const leftKey = `${left.date || ''} ${left.time || ''} ${left.createdAt || ''}`
  const rightKey = `${right.date || ''} ${right.time || ''} ${right.createdAt || ''}`
  return rightKey.localeCompare(leftKey)
}

export default function AdminDashboard({ onNavigate }) {
  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const { settings } = useOrganizationSettings()
  const { selectedAnimalType, animalTypeDetails } = useAnimalType()
  const { employees, loading: employeesLoading, error: employeesError } = useEmployees()
  const { flocks, loading: flocksLoading, error: flocksError } = useFlocks()
  const { activities, loading: activitiesLoading, error: activitiesError } = useEmployeeActivities()

  const loading = employeesLoading || flocksLoading || activitiesLoading
  const loadError = employeesError || flocksError || activitiesError

  const { stats, recentActivities } = useMemo(() => {
    const users = Storage.getUsers()
    const activeEmployees = employees.filter((employee) => employee.active)
    const todayActivities = activities.filter((activity) => activity.date === today)
    const noShowCount = activeEmployees.filter((employee) => !todayActivities.some((activity) => activity.employeeId === employee.id)).length

    return {
      stats: {
        totalUsers: users.filter((user) => user.active).length,
        totalEmployees: activeEmployees.length,
        activeFlocks: flocks.length,
        todayActivities: todayActivities.length,
        noShowCount,
      },
      recentActivities: [...activities].sort(sortActivities).slice(0, 8),
    }
  }, [activities, employees, flocks, today])
  const showPoultrySpecific = selectedAnimalType === 'poultry' || selectedAnimalType === 'all'

  if (loading) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
            {greeting}
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            {settings.farmName || 'Your Farm'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('daily-log')} className="btn-primary">
            + Log Today's Work
          </button>
        </div>
      </div>

      {loadError && (
        <div className="card" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
          {loadError}
        </div>
      )}

      <FarmHealthBanner stats={stats} details={animalTypeDetails} />

      <SmartSuggestions role="admin" onNavigate={onNavigate} />

      <div className="card" style={{ padding: '16px 20px' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.04em', opacity: 0.7 }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }} className="sm:grid-cols-4">
          {quickActions(animalTypeDetails).map((action) => (
            <button
              key={action.page}
              onClick={() => onNavigate(action.page)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: action.bg,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'transform .1s, filter .15s',
              }}
              onMouseEnter={(event) => { event.currentTarget.style.transform = 'scale(1.02)'; event.currentTarget.style.filter = 'brightness(.96)' }}
              onMouseLeave={(event) => { event.currentTarget.style.transform = 'scale(1)'; event.currentTarget.style.filter = 'brightness(1)' }}
            >
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: action.color }}>{action.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: action.color, opacity: 0.7 }}>{action.sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {showPoultrySpecific ? <EggProductionChart /> : <TasksChart />}
        <SalesRevenueChart />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {showPoultrySpecific ? <FCRTrendChart /> : <FeedCostChart />}
        <ProfitLossBarChart />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {showPoultrySpecific && <FeedCostChart />}
        <FlockPopulationChart />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="lg:grid-cols-3">
        <div className="card lg:col-span-2" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              Recent Farm Activities
            </h2>
            <button
              onClick={() => onNavigate('activities')}
              style={{ fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              See all
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px' }}>No activities logged yet.</p>
              <button onClick={() => onNavigate('daily-log')} className="btn-primary">Log First Activity</button>
            </div>
          ) : (
            recentActivities.map((activity, index) => {
              const badge = TASK_BADGE[activity.taskType] || { bg: '#f3f4f6', color: '#374151' }
              return (
                <div key={activity.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                  borderBottom: index < recentActivities.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-bg)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700,
                  }}>
                    {(activity.employeeName || 'U').charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.employeeName}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.description || activity.taskType}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: 500, background: badge.bg, color: badge.color }}>
                      {activity.taskType}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{activity.time || activity.date}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <WeatherWidget />

          <div className="card">
            <h2 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.04em', opacity: 0.7 }}>
              Farm Numbers
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'System Users', value: stats.totalUsers, color: '#dc2626' },
                { label: 'Active Workers', value: stats.totalEmployees, color: '#2563eb' },
                { label: animalTypeDetails.dashboardMetric, value: stats.activeFlocks, color: '#d97706' },
                { label: "Today's Tasks", value: stats.todayActivities, color: '#16a34a' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', flex: 1 }}>{row.label}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: row.color }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
