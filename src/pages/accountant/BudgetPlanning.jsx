import { useEffect, useMemo, useState } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useBudgets } from '../../hooks/useBudgets'
import { useExpenses } from '../../hooks/useExpenses'
import { useToast } from '../../components/ui'

const CATEGORIES = [
  'Feed',
  'Wages',
  'Equipment',
  'Utilities',
  'Medications/Supplements',
  'Infrastructure',
  'Miscellaneous',
]

const EMPTY_BUDGET = Object.fromEntries(CATEGORIES.map((category) => [category, '']))

export default function BudgetPlanning() {
  const { fmt } = useCurrency()
  const { showToast } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [year, setYear] = useState(today.slice(0, 4))
  const [month, setMonth] = useState(today.slice(5, 7))
  const [form, setForm] = useState(EMPTY_BUDGET)
  const [editMode, setEditMode] = useState(false)
  const [success, setSuccess] = useState('')

  const { budgets, loading: budgetsLoading, error: budgetsError, saveBudgetMonth } = useBudgets()
  const { expenses, loading: expensesLoading, error: expensesError } = useExpenses()

  const loading = budgetsLoading || expensesLoading
  const loadError = budgetsError || expensesError
  const selectedMonth = `${year}-${month}`

  const existingBudget = useMemo(
    () => budgets.find((budget) => budget.month === selectedMonth),
    [budgets, selectedMonth]
  )

  useEffect(() => {
    if (existingBudget) {
      const filled = {}
      CATEGORIES.forEach((category) => {
        filled[category] = String(existingBudget.categories[category] || '')
      })
      setForm(filled)
      setEditMode(false)
      return
    }

    setForm(EMPTY_BUDGET)
    setEditMode(false)
  }, [existingBudget])

  const actuals = useMemo(() => {
    const monthExpenses = expenses.filter((expense) => String(expense.date || '').startsWith(selectedMonth))
    const map = {}

    CATEGORIES.forEach((category) => {
      map[category] = monthExpenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
    })

    return map
  }, [expenses, selectedMonth])

  const rows = useMemo(() => {
    return CATEGORIES.map((category) => {
      const budgeted = parseFloat(form[category]) || 0
      const actual = actuals[category] || 0
      const variance = budgeted - actual
      const pct = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0
      return { cat: category, budgeted, actual, variance, pct }
    })
  }, [form, actuals])

  const totals = useMemo(() => {
    return rows.reduce(
      (accumulator, row) => ({
        budgeted: accumulator.budgeted + row.budgeted,
        actual: accumulator.actual + row.actual,
        variance: accumulator.variance + row.variance,
      }),
      { budgeted: 0, actual: 0, variance: 0 }
    )
  }, [rows])

  async function handleSave(event) {
    event.preventDefault()

    const categories = {}
    CATEGORIES.forEach((category) => {
      categories[category] = parseFloat(form[category]) || 0
    })

    try {
      await saveBudgetMonth(selectedMonth, categories)
      setEditMode(false)
      setSuccess('Budget saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setSuccess('')
      showToast({ variant: 'error', message: error.message || 'Failed to save budget.' })
    }
  }

  const isEditing = !existingBudget || editMode

  const months = [
    { val: '01', label: 'January' }, { val: '02', label: 'February' },
    { val: '03', label: 'March' }, { val: '04', label: 'April' },
    { val: '05', label: 'May' }, { val: '06', label: 'June' },
    { val: '07', label: 'July' }, { val: '08', label: 'August' },
    { val: '09', label: 'September' }, { val: '10', label: 'October' },
    { val: '11', label: 'November' }, { val: '12', label: 'December' },
  ]

  const years = []
  const currentYear = parseInt(today.slice(0, 4), 10)
  for (let value = currentYear - 2; value <= currentYear + 1; value += 1) years.push(String(value))

  if (loading) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading budgets...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-[var(--text)]">Budget Planning</h2>
        <div className="flex items-center gap-2">
          <select
            className="input-field text-sm w-auto"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          >
            {months.map((monthOption) => <option key={monthOption.val} value={monthOption.val}>{monthOption.label}</option>)}
          </select>
          <select
            className="input-field text-sm w-auto"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            {years.map((yearOption) => <option key={yearOption} value={yearOption}>{yearOption}</option>)}
          </select>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
          {success}
        </div>
      )}

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
          {loadError}
        </div>
      )}

      {!existingBudget && !editMode ? (
        <div className="card text-center py-12">
          <p className="text-[var(--text-muted)] font-medium mb-1">No budget for {selectedMonth}</p>
          <p className="text-[var(--text-dim)] text-sm mb-4">Create a budget to track your spending against targets.</p>
          <button onClick={() => setEditMode(true)} className="btn-primary">
            Create Budget
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="card overflow-hidden p-0">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text)]">
                Budget - {months.find((monthOption) => monthOption.val === month)?.label} {year}
              </h3>
              {existingBudget && !editMode && (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="text-xs text-[var(--accent)] font-medium hover:underline"
                >
                  Edit Budget
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Category</th>
                    <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Budgeted</th>
                    <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Actual</th>
                    <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Variance</th>
                    <th className="text-left px-4 py-2.5 font-semibold w-40" style={{ color: 'var(--text-muted)' }}>% Used</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.cat} className="border-b transition-colors" style={{ borderColor: 'color-mix(in srgb, var(--border) 40%, transparent)' }} onMouseEnter={(event) => { event.currentTarget.style.background = 'var(--surface-2)' }} onMouseLeave={(event) => { event.currentTarget.style.background = 'transparent' }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text)' }}>{row.cat}</td>
                      <td className="px-4 py-2.5 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="100"
                            className="w-28 px-2 py-1 border border-[var(--border)] rounded-lg text-right text-sm focus:outline-none focus:border-farm-orange"
                            value={form[row.cat]}
                            onChange={(event) => setForm({ ...form, [row.cat]: event.target.value })}
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-[var(--text-muted)]">{fmt(row.budgeted)}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-[var(--text)]">{fmt(row.actual)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${row.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.variance >= 0 ? '+' : ''}{fmt(row.variance)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${row.pct >= 100 ? 'bg-red-500' : row.pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${row.pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-dim)] w-9 shrink-0">{row.pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold border-t-2" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>Total</td>
                    <td className="px-4 py-2.5 text-right" style={{ color: 'var(--accent)' }}>{fmt(totals.budgeted)}</td>
                    <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text)' }}>{fmt(totals.actual)}</td>
                    <td className={`px-4 py-2.5 text-right ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totals.variance >= 0 ? '+' : ''}{fmt(totals.variance)}
                    </td>
                    <td className="px-4 py-2.5" />
                  </tr>
                </tfoot>
              </table>
            </div>
            {isEditing && (
              <div className="px-4 py-3 border-t border-[var(--border)] flex gap-2">
                <button type="submit" className="btn-primary">
                  Save Budget
                </button>
                {existingBudget && (
                  <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
