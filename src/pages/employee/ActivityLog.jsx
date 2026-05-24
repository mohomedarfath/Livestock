import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useEmployees } from '../../hooks/useEmployees'
import { useFlocks } from '../../hooks/useFlocks'
import { useEmployeeActivities } from '../../hooks/useEmployeeActivities'

const TASK_TYPES = ['Feeding', 'Cleaning', 'Health Check', 'Egg Collection', 'Medication', 'Vaccination', 'Maintenance', 'Other']

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

function getWeekRange() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - 6)

  return {
    from: start.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  }
}

export default function ActivityLog() {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const nowTime = new Date().toTimeString().slice(0, 5)

  const { employees, loading: employeesLoading, error: employeesError } = useEmployees()
  const { flocks, loading: flocksLoading, error: flocksError } = useFlocks()
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    createActivity,
  } = useEmployeeActivities()

  const weekRange = getWeekRange()
  const [rangeFrom, setRangeFrom] = useState(weekRange.from)
  const [rangeTo, setRangeTo] = useState(weekRange.to)
  const [form, setForm] = useState({
    date: today,
    time: nowTime,
    taskType: 'Feeding',
    description: '',
    hours: '1',
    flockId: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  const loading = employeesLoading || flocksLoading || activitiesLoading
  const loadError = employeesError || flocksError || activitiesError

  const employee = useMemo(
    () => employees.find((entry) => entry.userId === user.id) || null,
    [employees, user.id]
  )

  const myActivities = useMemo(() => {
    if (!employee) return []

    return activities
      .filter((activity) => activity.employeeId === employee.id)
      .sort((left, right) => {
        if (right.date !== left.date) return String(right.date || '').localeCompare(String(left.date || ''))
        return String(right.time || '').localeCompare(String(left.time || ''))
      })
  }, [activities, employee])

  const filteredActivities = useMemo(() => {
    return myActivities.filter((activity) => {
      if (rangeFrom && activity.date < rangeFrom) return false
      if (rangeTo && activity.date > rangeTo) return false
      return true
    })
  }, [myActivities, rangeFrom, rangeTo])

  const hoursThisWeek = useMemo(() => {
    const currentWeekRange = getWeekRange()
    return myActivities
      .filter((activity) => activity.date >= currentWeekRange.from && activity.date <= currentWeekRange.to)
      .reduce((sum, activity) => sum + (parseFloat(activity.hours) || 0), 0)
  }, [myActivities])

  const hoursThisMonth = useMemo(() => {
    const monthStart = today.slice(0, 7)
    return myActivities
      .filter((activity) => String(activity.date || '').startsWith(monthStart))
      .reduce((sum, activity) => sum + (parseFloat(activity.hours) || 0), 0)
  }, [myActivities, today])

  function validate() {
    const nextErrors = {}
    if (!form.date) nextErrors.date = 'Date is required'
    if (!form.time) nextErrors.time = 'Time is required'
    if (!form.taskType) nextErrors.taskType = 'Task type is required'
    if (!form.description.trim()) nextErrors.description = 'Description is required'
    if (!form.hours || Number.isNaN(parseFloat(form.hours)) || parseFloat(form.hours) <= 0) {
      nextErrors.hours = 'Enter valid hours (> 0)'
    }
    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (!employee) return

    setErrors({})

    try {
      await createActivity({
        employeeId: employee.id,
        flockId: form.flockId || null,
        taskType: form.taskType,
        description: form.description.trim(),
        hours: parseFloat(form.hours),
        date: form.date,
        time: form.time,
        notes: form.notes.trim(),
      })

      setForm({
        date: today,
        time: nowTime,
        taskType: 'Feeding',
        description: '',
        hours: '1',
        flockId: '',
        notes: '',
      })
      setSuccess('Activity logged successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save activity.' })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[var(--text-dim)]">Loading your activity log...</p>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold text-[var(--text)] mb-2">Profile Not Found</h2>
        <p className="text-[var(--text-dim)] max-w-sm">
          Contact your manager to set up your employee profile. You need an employee record linked to your account to log activities.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold text-[var(--text)] mb-4">Log New Activity</h2>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm mb-4">
            {loadError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Date *</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
            {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Time *</label>
            <input
              type="time"
              className="input-field"
              value={form.time}
              onChange={(event) => setForm({ ...form, time: event.target.value })}
            />
            {errors.time && <p className="text-red-600 text-xs mt-1">{errors.time}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Task Type *</label>
            <select
              className="input-field"
              value={form.taskType}
              onChange={(event) => setForm({ ...form, taskType: event.target.value })}
            >
              {TASK_TYPES.map((taskType) => <option key={taskType} value={taskType}>{taskType}</option>)}
            </select>
            {errors.taskType && <p className="text-red-600 text-xs mt-1">{errors.taskType}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Hours Worked *</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              className="input-field"
              value={form.hours}
              onChange={(event) => setForm({ ...form, hours: event.target.value })}
              placeholder="1.5"
            />
            {errors.hours && <p className="text-red-600 text-xs mt-1">{errors.hours}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Task Description *</label>
            <input
              className="input-field"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Describe the task performed"
            />
            {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Flock</label>
            <select
              className="input-field"
              value={form.flockId}
              onChange={(event) => setForm({ ...form, flockId: event.target.value })}
            >
              <option value="">-- Select Flock (optional) --</option>
              {flocks.map((flock) => <option key={flock.id} value={flock.id}>{flock.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Notes</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Any additional notes..."
            />
          </div>
          {errors.submit && (
            <div className="md:col-span-2">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">
              Submit Activity
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-[var(--text)]">{hoursThisWeek.toFixed(1)}h</p>
          <p className="text-sm text-[var(--text-dim)] mt-1">Total Hours This Week</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-[var(--text)]">{hoursThisMonth.toFixed(1)}h</p>
          <p className="text-sm text-[var(--text-dim)] mt-1">Total Hours This Month</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 className="font-semibold text-[var(--text)]">My Activities</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-[var(--text-muted)]">From:</label>
            <input
              type="date"
              className="input-field text-xs py-1 w-auto"
              value={rangeFrom}
              onChange={(event) => setRangeFrom(event.target.value)}
            />
            <label className="text-xs text-[var(--text-muted)]">To:</label>
            <input
              type="date"
              className="input-field text-xs py-1 w-auto"
              value={rangeTo}
              onChange={(event) => setRangeTo(event.target.value)}
            />
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <p className="text-center text-[var(--text-dim)] py-8">No activities in this date range.</p>
        ) : (
          <div className="space-y-2">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-[var(--surface-2)] rounded-xl">
                <div className="shrink-0 text-center min-w-[48px]">
                  <p className="text-xs text-[var(--text-dim)]">{String(activity.date || '').slice(5)}</p>
                  <p className="text-xs text-[var(--text-dim)] font-medium">{activity.time || ''}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_COLORS[activity.taskType] || 'bg-[var(--surface-2)] text-[var(--text)]'}`}>
                      {activity.taskType}
                    </span>
                    {activity.flockName && (
                      <span className="text-xs text-[var(--text-dim)]">{activity.flockName}</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text)] mt-1">{activity.description}</p>
                  {activity.notes && <p className="text-xs text-[var(--text-dim)] mt-0.5 italic">{activity.notes}</p>}
                </div>
                <div className="shrink-0 text-sm font-bold text-[var(--text)]">{activity.hours}h</div>
              </div>
            ))}
          </div>
        )}

        {filteredActivities.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between text-sm">
            <span className="text-[var(--text-dim)]">{filteredActivities.length} activities</span>
            <span className="font-semibold text-[var(--text)]">
              Total: {filteredActivities.reduce((sum, activity) => sum + (parseFloat(activity.hours) || 0), 0).toFixed(1)}h
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
