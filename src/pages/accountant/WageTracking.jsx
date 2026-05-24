import { useMemo, useState } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useEmployees } from '../../hooks/useEmployees'
import { useEmployeeActivities } from '../../hooks/useEmployeeActivities'
import { useWages } from '../../hooks/useWages'
import { useConfirm, useToast } from '../../components/ui'

export default function WageTracking() {
  const { fmt } = useCurrency()
  const confirm = useConfirm()
  const { showToast } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [year, setYear] = useState(today.slice(0, 4))
  const [month, setMonth] = useState(today.slice(5, 7))
  const [calcMsg, setCalcMsg] = useState('')

  const { employees, loading: employeesLoading, error: employeesError } = useEmployees()
  const { activities, loading: activitiesLoading, error: activitiesError } = useEmployeeActivities()
  const {
    wages,
    loading: wagesLoading,
    error: wagesError,
    saveWagesForMonth,
    markWagePaid,
  } = useWages()

  const loading = employeesLoading || activitiesLoading || wagesLoading
  const loadError = employeesError || activitiesError || wagesError
  const selectedMonth = `${year}-${month}`
  const activeEmployees = useMemo(() => employees.filter((employee) => employee.active), [employees])

  const monthWages = useMemo(
    () => wages.filter((wage) => wage.month === selectedMonth),
    [wages, selectedMonth]
  )

  const hoursPerEmployee = useMemo(() => {
    const monthActivities = activities.filter((activity) => String(activity.date || '').startsWith(selectedMonth))
    const map = {}

    monthActivities.forEach((activity) => {
      map[activity.employeeId] = (map[activity.employeeId] || 0) + (parseFloat(activity.hours) || 0)
    })

    return map
  }, [activities, selectedMonth])

  const rows = useMemo(() => {
    return activeEmployees.map((employee) => {
      const hours = hoursPerEmployee[employee.id] || 0
      const wage = monthWages.find((entry) => entry.employeeId === employee.id)
      const rate = parseFloat(employee.rate) || 0
      const calculated = employee.wageType === 'hourly' ? hours * rate : rate

      return {
        ...employee,
        hoursWorked: hours,
        calculatedWage: wage ? wage.calculatedWage : calculated,
        status: wage ? wage.status : 'pending',
      }
    })
  }, [activeEmployees, hoursPerEmployee, monthWages])

  const totals = useMemo(() => {
    const totalDue = rows.reduce((sum, row) => sum + row.calculatedWage, 0)
    const totalPaid = rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.calculatedWage, 0)
    return { totalDue, totalPaid, outstanding: totalDue - totalPaid }
  }, [rows])

  async function calculateWages() {
    const nextRows = activeEmployees.map((employee) => {
      const hours = hoursPerEmployee[employee.id] || 0
      const rate = parseFloat(employee.rate) || 0
      const calculated = employee.wageType === 'hourly' ? hours * rate : rate
      const existing = wages.find((wage) => wage.employeeId === employee.id && wage.month === selectedMonth)

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        month: selectedMonth,
        hoursWorked: hours,
        rate,
        wageType: employee.wageType,
        calculatedWage: parseFloat(calculated.toFixed(2)),
        status: existing ? existing.status : 'pending',
        paidAt: existing?.paidAt || null,
      }
    })

    try {
      await saveWagesForMonth(selectedMonth, nextRows)
      setCalcMsg('Wages calculated successfully!')
      setTimeout(() => setCalcMsg(''), 3000)
    } catch (error) {
      setCalcMsg('')
      showToast({ variant: 'error', message: error.message || 'Failed to calculate wages.' })
    }
  }

  async function handleMarkPaid(employeeId) {
    const confirmed = await confirm({
      title: 'Mark wage as paid?',
      description: 'This updates the wage status for the selected employee and month.',
      confirmLabel: 'Mark paid',
    })
    if (!confirmed) return

    const employee = activeEmployees.find((entry) => entry.id === employeeId)
    if (!employee) return

    const hours = hoursPerEmployee[employeeId] || 0
    const rate = parseFloat(employee.rate) || 0
    const calculated = employee.wageType === 'hourly' ? hours * rate : rate

    try {
      await markWagePaid(employeeId, selectedMonth, {
        employeeId,
        employeeName: employee.name,
        hoursWorked: hours,
        rate,
        wageType: employee.wageType,
        calculatedWage: parseFloat(calculated.toFixed(2)),
        status: 'paid',
        paidAt: today,
      })
    } catch (error) {
      showToast({ variant: 'error', message: error.message || 'Failed to mark wage as paid.' })
    }
  }

  const monthLabels = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    val: String(index + 1).padStart(2, '0'),
    label: monthLabels[index + 1],
  }))

  const currentYear = parseInt(today.slice(0, 4), 10)
  const years = Array.from({ length: 4 }, (_, index) => String(currentYear - 2 + index))

  if (loading) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading wages...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-[var(--text)]">Wage Tracking</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input-field text-sm w-auto" value={month} onChange={(event) => setMonth(event.target.value)}>
            {monthOptions.map((monthOption) => <option key={monthOption.val} value={monthOption.val}>{monthOption.label}</option>)}
          </select>
          <select className="input-field text-sm w-auto" value={year} onChange={(event) => setYear(event.target.value)}>
            {years.map((yearOption) => <option key={yearOption} value={yearOption}>{yearOption}</option>)}
          </select>
          <button onClick={calculateWages} className="btn-primary text-sm">
            Calculate Wages
          </button>
        </div>
      </div>

      {calcMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
          {calcMsg}
        </div>
      )}

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xl font-bold text-[var(--text)]">{fmt(totals.totalDue)}</p>
          <p className="text-xs text-[var(--text-dim)] mt-1">Total Wages Due</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold text-green-600">{fmt(totals.totalPaid)}</p>
          <p className="text-xs text-[var(--text-dim)] mt-1">Total Paid</p>
        </div>
        <div className="card text-center">
          <p className={`text-xl font-bold ${totals.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {fmt(totals.outstanding)}
          </p>
          <p className="text-xs text-[var(--text-dim)] mt-1">Outstanding</p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text)]">
            Wages - {monthLabels[parseInt(month, 10)]} {year}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-muted)]">Employee</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-muted)]">Wage Type</th>
                <th className="text-right px-4 py-2.5 font-semibold text-[var(--text-muted)]">Hours</th>
                <th className="text-right px-4 py-2.5 font-semibold text-[var(--text-muted)]">Rate</th>
                <th className="text-right px-4 py-2.5 font-semibold text-[var(--text-muted)]">Calculated</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-muted)]">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-muted)]">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((employee) => (
                <tr key={employee.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-farm-orange flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text)]">{employee.name}</p>
                        <p className="text-xs text-[var(--text-dim)]">{employee.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${employee.wageType === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {employee.wageType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--text)]">
                    {employee.wageType === 'hourly' ? `${employee.hoursWorked.toFixed(1)}h` : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--text)]">
                    {employee.wageType === 'hourly' ? `${fmt(employee.rate)}/hr` : `${fmt(employee.rate)}/mo`}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[var(--text)]">{fmt(employee.calculatedWage)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${employee.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {employee.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {employee.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkPaid(employee.id)}
                        className="text-xs px-2.5 py-1 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg transition-colors font-medium"
                      >
                        Mark Paid
                      </button>
                    )}
                    {employee.status === 'paid' && (
                      <span className="text-xs text-green-600 font-medium">Done</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-dim)]">
                    No active employees. Add employees to the roster first.
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--border)] font-bold">
                  <td colSpan={4} className="px-4 py-2.5 text-[var(--text)] text-right">Total:</td>
                  <td className="px-4 py-2.5 text-right text-[var(--text)]">{fmt(totals.totalDue)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
