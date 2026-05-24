import { useMemo, useState } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useExpenses } from '../../hooks/useExpenses'
import { useFlocks } from '../../hooks/useFlocks'
import { validateExpense } from '../../utils/validation'
import { useFilters } from '../../hooks/useFilters'
import { formatDate } from '../../utils/format'
import { Alert, DataTable, EmptyState, IconButton, PageHeader, Skeleton, useConfirm } from '../../components/ui'

const CATEGORIES = ['Feed', 'Wages', 'Equipment', 'Utilities', 'Medications', 'Infrastructure', 'Miscellaneous']

const CAT_BASE_COLORS = {
  Feed: '#d97706',
  Wages: '#3b82f6',
  Equipment: '#6b7280',
  Utilities: '#ea580c',
  Medications: '#ef4444',
  Infrastructure: '#8b5cf6',
  Miscellaneous: '#14b8a6',
}

function createEmptyForm() {
  return {
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Feed',
    description: '',
    reference: '',
    flockId: '',
  }
}

export default function ExpenseTracking() {
  const { fmt } = useCurrency()
  const confirm = useConfirm()
  const today = new Date().toISOString().split('T')[0]
  const { expenses, loading, error, createExpense, removeExpense } = useExpenses()
  const { flocks } = useFlocks()
  const filterDefaults = useMemo(
    () => ({
      year: today.slice(0, 4),
      month: today.slice(5, 7),
      category: 'all',
      flock: 'all',
    }),
    [today]
  )
  const { filters, setFilter, resetFilters } = useFilters(filterDefaults)

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(createEmptyForm())
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  const filterYear = filters.year
  const filterMonth = filters.month
  const filterCat = filters.category
  const filterFlock = filters.flock

  const selectedMonth = `${filterYear}-${filterMonth}`

  const filtered = useMemo(
    () =>
      expenses
        .filter((expense) => {
          if (!expense.date?.startsWith(selectedMonth)) return false
          if (filterCat !== 'all' && expense.category !== filterCat) return false
          if (filterFlock !== 'all' && String(expense.flockId || '') !== filterFlock) return false
          return true
        })
        .sort((left, right) => right.date.localeCompare(left.date)),
    [expenses, filterCat, filterFlock, selectedMonth]
  )

  const runningTotal = useMemo(
    () => filtered.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0),
    [filtered]
  )

  const catSummary = useMemo(() => {
    const totals = {}
    filtered.forEach((expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + (parseFloat(expense.amount) || 0)
    })
    return Object.entries(totals).sort((left, right) => right[1] - left[1])
  }, [filtered])

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateExpense(form)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    const selectedFlock = flocks.find((flock) => String(flock.id) === String(form.flockId))
    const payload = {
      date: form.date,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description.trim(),
      reference: form.reference.trim(),
      flockId: form.flockId || null,
      flockName: selectedFlock?.name || '',
    }

    try {
      await createExpense(payload)
      setForm(createEmptyForm())
      setFormOpen(false)
      setSuccess(navigator.onLine ? 'Expense saved successfully.' : 'Expense saved offline and will sync when you reconnect.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setSuccess('')
      setErrors({ submit: err.message || 'Failed to save expense.' })
    }
  }

  async function deleteExpense(expenseId) {
    const confirmed = await confirm({
      title: 'Delete expense?',
      description: 'This removes the expense from this workspace.',
      confirmLabel: 'Delete expense',
      destructive: true,
    })
    if (!confirmed) return

    try {
      await removeExpense(expenseId)
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to delete expense.' })
    }
  }

  const monthOptions = [
    { val: '01', label: 'January' }, { val: '02', label: 'February' },
    { val: '03', label: 'March' }, { val: '04', label: 'April' },
    { val: '05', label: 'May' }, { val: '06', label: 'June' },
    { val: '07', label: 'July' }, { val: '08', label: 'August' },
    { val: '09', label: 'September' }, { val: '10', label: 'October' },
    { val: '11', label: 'November' }, { val: '12', label: 'December' },
  ]
  const currentYear = parseInt(today.slice(0, 4), 10)
  const years = Array.from({ length: 4 }, (_, index) => String(currentYear - 2 + index))
  const columns = [
    { key: 'date', header: 'Date', render: (expense) => formatDate(expense.date, 'compact') },
    {
      key: 'category',
      header: 'Category',
      render: (expense) => {
        const baseColor = CAT_BASE_COLORS[expense.category] || '#8b5cf6'
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: baseColor, background: `color-mix(in srgb, ${baseColor} 15%, var(--surface))` }}>
            {expense.category}
          </span>
        )
      },
    },
    {
      key: 'description',
      header: 'Description',
      minWidth: '220px',
      render: (expense) => <span className="block max-w-[260px] truncate">{expense.description}</span>,
    },
    { key: 'reference', header: 'Ref.', render: (expense) => expense.reference || '-', muted: true },
    { key: 'flockName', header: 'Flock', render: (expense) => expense.flockName || '-', muted: true },
    { key: 'amount', header: 'Amount', align: 'right', render: (expense) => <span style={{ color: 'var(--accent-ink)', fontWeight: 700 }}>{fmt(expense.amount)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (expense) => (
        <IconButton
          label={`Delete expense ${expense.description}`}
          size="sm"
          variant="danger"
          onClick={() => deleteExpense(expense.id)}
        >
          x
        </IconButton>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expense Tracking"
        subtitle="Repository-backed expenses with offline queue support."
        actions={
          <>
            <button type="button" onClick={resetFilters} className="btn-secondary text-sm">Reset filters</button>
            <button type="button" onClick={() => setFormOpen((value) => !value)} className="btn-primary text-sm">
              {formOpen ? 'Cancel' : '+ Add Expense'}
            </button>
          </>
        }
      />

      {(success || error || errors.submit) && (
        <Alert variant={success ? 'success' : 'error'}>
          {success || errors.submit || error}
        </Alert>
      )}

      {formOpen && (
        <div className="card border" style={{ borderColor: 'var(--accent)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>New Expense</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Date *</label>
              <input type="date" className="input-field" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              {errors.date && <p className="text-red-500 text-xs mt-1 font-medium">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Amount *</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" />
              {errors.amount && <p className="text-red-500 text-xs mt-1 font-medium">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Category *</label>
              <select className="input-field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1 font-medium">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Reference No.</label>
              <input className="input-field" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="INV-001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Description *</label>
              <input className="input-field" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Brief description of expense" />
              {errors.description && <p className="text-red-500 text-xs mt-1 font-medium">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Flock (optional)</label>
              <select className="input-field" value={form.flockId} onChange={(event) => setForm({ ...form, flockId: event.target.value })}>
                <option value="">-- No Flock --</option>
                {flocks.map((flock) => <option key={flock.id} value={flock.id}>{flock.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 mt-2">
              <button type="submit" className="btn-primary" disabled={loading}>Save Expense</button>
            </div>
          </form>
        </div>
      )}

      <div className="card grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Month</label>
          <select className="input-field text-sm" value={filterMonth} onChange={(event) => setFilter('month', event.target.value)}>
            {monthOptions.map((month) => <option key={month.val} value={month.val}>{month.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Year</label>
          <select className="input-field text-sm" value={filterYear} onChange={(event) => setFilter('year', event.target.value)}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Category</label>
          <select className="input-field text-sm" value={filterCat} onChange={(event) => setFilter('category', event.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Flock</label>
          <select className="input-field text-sm" value={filterFlock} onChange={(event) => setFilter('flock', event.target.value)}>
            <option value="all">All Flocks</option>
            {flocks.map((flock) => <option key={flock.id} value={String(flock.id)}>{flock.name}</option>)}
          </select>
        </div>
      </div>

      {catSummary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {catSummary.map(([category, total]) => {
            const baseColor = CAT_BASE_COLORS[category] || '#8b5cf6'
            return (
              <div key={category} className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: baseColor, background: `color-mix(in srgb, ${baseColor} 15%, var(--surface))` }}>
                  {category}
                </span>
                <p className="text-xl font-bold mt-2" style={{ color: 'var(--text)' }}>{fmt(total)}</p>
              </div>
            )
          })}
        </div>
      )}

      {loading ? (
        <Skeleton variant="table" count={6} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          empty={<EmptyState icon="None" title="No expenses found" description="Try changing the filters or add the first expense for this period." />}
          footer={
            <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--border)]">
              <td colSpan={5} className="px-4 py-3 font-semibold text-[var(--text)] text-right">Total:</td>
              <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--accent-ink)' }}>{fmt(runningTotal)}</td>
              <td />
            </tr>
          }
        />
      )}

      <div className="hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
            {filtered.length} {filtered.length === 1 ? 'expense' : 'expenses'}
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Total: {fmt(runningTotal)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Date</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Category</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Description</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Ref.</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Flock</th>
                <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Amount</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-dim)' }}>Loading expenses...</td>
                </tr>
              )}
              {!loading && filtered.map((expense) => {
                const baseColor = CAT_BASE_COLORS[expense.category] || '#8b5cf6'
                return (
                  <tr key={expense.id} className="border-b transition-colors" style={{ borderColor: 'color-mix(in srgb, var(--border) 40%, transparent)' }}>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{new Date(`${expense.date}T00:00:00`).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: baseColor, background: `color-mix(in srgb, ${baseColor} 15%, var(--surface))` }}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate" style={{ color: 'var(--text)' }}>{expense.description}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{expense.reference || '-'}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-dim)' }}>{expense.flockName || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--accent)' }}>{fmt(expense.amount)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        type="button"
                        aria-label={`Delete expense ${expense.description}`}
                        className="min-h-10 min-w-10 transition-colors text-lg leading-none"
                        title="Delete expense"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-dim)' }}>No expenses for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
