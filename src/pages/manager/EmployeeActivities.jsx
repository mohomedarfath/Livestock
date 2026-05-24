import { useMemo } from 'react'
import { useEmployees } from '../../hooks/useEmployees'
import { useFlocks } from '../../hooks/useFlocks'
import { useEmployeeActivities } from '../../hooks/useEmployeeActivities'
import { useFilters } from '../../hooks/useFilters'
import { formatDate, formatHours } from '../../utils/format'
import { Alert, DataTable, EmptyState, PageHeader, Skeleton } from '../../components/ui'

const TASK_COLORS = {
  Feeding: 'bg-yellow-100 text-yellow-800',
  Cleaning: 'bg-blue-100 text-blue-800',
  'Health Check': 'bg-red-100 text-red-800',
  'Egg Collection': 'bg-orange-100 text-orange-800',
  Medication: 'bg-purple-100 text-purple-800',
  Vaccination: 'bg-pink-100 text-pink-800',
  Maintenance: 'bg-[var(--surface-2)] text-[var(--text)]',
  Other: 'bg-teal-100 text-teal-800',
}

const today = new Date().toISOString().split('T')[0]

export default function EmployeeActivities() {
  const filterDefaults = useMemo(() => ({ date: today, employee: 'all', flock: 'all', task: 'all' }), [])
  const { filters, setFilter, resetFilters } = useFilters(filterDefaults)
  const dateFilter = filters.date
  const employeeFilter = filters.employee
  const flockFilter = filters.flock
  const taskFilter = filters.task

  const { employees, loading: employeesLoading, error: employeesError } = useEmployees()
  const { flocks, loading: flocksLoading, error: flocksError } = useFlocks()
  const { activities, loading: activitiesLoading, error: activitiesError } = useEmployeeActivities()

  const loading = employeesLoading || flocksLoading || activitiesLoading
  const loadError = employeesError || flocksError || activitiesError
  const activeEmployees = useMemo(() => employees.filter((employee) => employee.active), [employees])

  const filtered = useMemo(() => {
    return activities
      .filter((activity) => {
        if (dateFilter && activity.date !== dateFilter) return false
        if (employeeFilter !== 'all' && activity.employeeId !== employeeFilter) return false
        if (flockFilter !== 'all' && activity.flockId !== flockFilter) return false
        if (taskFilter !== 'all' && activity.taskType !== taskFilter) return false
        return true
      })
      .sort((left, right) => {
        if (right.date !== left.date) return String(right.date || '').localeCompare(String(left.date || ''))
        return String(right.time || '').localeCompare(String(left.time || ''))
      })
  }, [activities, dateFilter, employeeFilter, flockFilter, taskFilter])

  const totalHours = useMemo(
    () => filtered.reduce((sum, activity) => sum + (parseFloat(activity.hours) || 0), 0),
    [filtered]
  )

  const employeeHours = useMemo(() => {
    const map = {}

    filtered.forEach((activity) => {
      if (!map[activity.employeeId]) {
        map[activity.employeeId] = {
          name: activity.employeeName || 'Unknown',
          hours: 0,
          tasks: 0,
        }
      }

      map[activity.employeeId].hours += parseFloat(activity.hours) || 0
      map[activity.employeeId].tasks += 1
    })

    return Object.values(map).sort((left, right) => right.hours - left.hours)
  }, [filtered])

  function exportCSV() {
    const headers = ['Date', 'Time', 'Employee', 'Flock', 'Task Type', 'Description', 'Hours', 'Notes']
    const rows = filtered.map((activity) => [
      activity.date,
      activity.time || '',
      activity.employeeName || '',
      activity.flockName || '',
      activity.taskType,
      `"${(activity.description || '').replace(/"/g, '""')}"`,
      activity.hours,
      `"${(activity.notes || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `activities_${dateFilter || 'all'}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const taskTypes = ['Feeding', 'Cleaning', 'Health Check', 'Egg Collection', 'Medication', 'Vaccination', 'Maintenance', 'Other']
  const columns = [
    { key: 'date', header: 'Date', render: (activity) => formatDate(activity.date, 'compact'), muted: true },
    { key: 'time', header: 'Time', render: (activity) => activity.time || '-', muted: true },
    { key: 'employeeName', header: 'Employee', render: (activity) => activity.employeeName || '-' },
    { key: 'flockName', header: 'Flock', render: (activity) => activity.flockName || '-', muted: true },
    {
      key: 'taskType',
      header: 'Task',
      render: (activity) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_COLORS[activity.taskType] || 'bg-[var(--surface-2)] text-[var(--text)]'}`}>
          {activity.taskType}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      minWidth: '220px',
      render: (activity) => <span className="block max-w-[260px] truncate">{activity.description || '-'}</span>,
      muted: true,
    },
    { key: 'hours', header: 'Hours', render: (activity) => formatHours(activity.hours) },
  ]

  if (loading) {
    return (
      <Skeleton variant="table" count={6} />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employee Activities"
        subtitle="Review logged work by employee, flock, task, and date."
        actions={
          <>
            <button type="button" onClick={resetFilters} className="btn-secondary text-sm">Reset filters</button>
            <button type="button" onClick={exportCSV} className="btn-secondary text-sm">Export CSV</button>
          </>
        }
      />

      {loadError && (
        <Alert variant="error">
          {loadError}
        </Alert>
      )}

      <div className="card grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Date</label>
          <input
            type="date"
            className="input-field text-sm"
            value={dateFilter}
            onChange={(event) => setFilter('date', event.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Employee</label>
          <select
            className="input-field text-sm"
            value={employeeFilter}
            onChange={(event) => setFilter('employee', event.target.value)}
          >
            <option value="all">All Employees</option>
            {activeEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Flock</label>
          <select
            className="input-field text-sm"
            value={flockFilter}
            onChange={(event) => setFilter('flock', event.target.value)}
          >
            <option value="all">All Flocks</option>
            {flocks.map((flock) => (
              <option key={flock.id} value={flock.id}>{flock.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Task Type</label>
          <select
            className="input-field text-sm"
            value={taskFilter}
            onChange={(event) => setFilter('task', event.target.value)}
          >
            <option value="all">All Tasks</option>
            {taskTypes.map((taskType) => (
              <option key={taskType} value={taskType}>{taskType}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        empty={<EmptyState icon="None" title="No activities found" description="Try changing the filters or ask employees to log today's work." />}
        footer={
          <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--border)]">
            <td colSpan={6} className="px-4 py-3 font-semibold text-[var(--text)] text-right">Total Hours:</td>
            <td className="px-4 py-3 font-bold text-[var(--text)]">{formatHours(totalHours)}</td>
          </tr>
        }
      />

      {employeeHours.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text)] mb-3">Per-Employee Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {employeeHours.map((employee) => (
              <div key={employee.name} className="card text-center">
                <div className="w-10 h-10 rounded-full bg-farm-orange mx-auto flex items-center justify-center text-white font-bold mb-2">
                  {employee.name.charAt(0)}
                </div>
                <p className="font-medium text-[var(--text)] text-sm truncate">{employee.name}</p>
                <p className="text-2xl font-bold text-[var(--text)] mt-1">{employee.hours.toFixed(1)}h</p>
                <p className="text-xs text-[var(--text-dim)]">{employee.tasks} task{employee.tasks !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
