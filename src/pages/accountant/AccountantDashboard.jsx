import { useMemo } from 'react'
import { Storage } from '../../utils/storage'
import { useCurrency } from '../../utils/currency.jsx'
import { useExpenses } from '../../hooks/useExpenses'
import { useWages } from '../../hooks/useWages'
import { useBudgets } from '../../hooks/useBudgets'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const PIE_COLORS = ['#c8785a', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#f59e0b', '#14b8a6']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const STAT_CFG = [
  { label: 'Expenses This Month', key: 'totalExpenses', bg: '#fff1f2', color: '#e11d48' },
  { label: 'Wages This Month', key: 'totalWages', bg: '#eff6ff', color: '#2563eb' },
  { label: 'Net (Rev - Exp.)', key: 'net', bg: '#f0fdf4', color: '#16a34a', sub: 'Revenue not tracked' },
  { label: 'Budget Remaining', key: 'budgetRemaining', bg: '#fefce8', color: '#ca8a04' },
]

function StatCard({ label, value, sub, overBudget, bg, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0, background: overBudget ? '#fff1f2' : bg }} />
      <div>
        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 700, color: overBudget ? '#e11d48' : color, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ margin: '3px 0 0', fontSize: '11px', color: overBudget ? '#e11d48' : '#9ca3af' }}>{overBudget ? 'Over budget' : sub}</p>}
      </div>
    </div>
  )
}

function sortByDateDesc(left, right) {
  const leftKey = `${left.date || left.expenseDate || ''} ${left.createdAt || ''}`
  const rightKey = `${right.date || right.expenseDate || ''} ${right.createdAt || ''}`
  return rightKey.localeCompare(leftKey)
}

export default function AccountantDashboard({ onNavigate }) {
  const { fmt } = useCurrency()
  const { expenses, loading: expensesLoading, error: expensesError } = useExpenses()
  const { wages, loading: wagesLoading, error: wagesError } = useWages()
  const { budgets, loading: budgetsLoading, error: budgetsError } = useBudgets()

  const loading = expensesLoading || wagesLoading || budgetsLoading
  const loadError = expensesError || wagesError || budgetsError
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)

  const data = useMemo(() => {
    const monthExpenses = expenses.filter((expense) => String(expense.date || '').startsWith(currentMonth))
    const totalExpenses = monthExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
    const monthWages = wages.filter((wage) => wage.month === currentMonth)
    const totalWages = monthWages.reduce((sum, wage) => sum + (parseFloat(wage.calculatedWage) || 0), 0)

    const budget = budgets.find((entry) => entry.month === currentMonth)
    const totalBudget = budget ? Object.values(budget.categories).reduce((sum, value) => sum + (parseFloat(value) || 0), 0) : 0
    const budgetRemaining = totalBudget - totalExpenses - totalWages

    const now = new Date()
    const last6 = []
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const total = expenses
        .filter((expense) => String(expense.date || '').startsWith(monthKey))
        .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
      last6.push({ month: MONTHS[date.getMonth()], amount: parseFloat(total.toFixed(2)) })
    }

    const categoryMap = {}
    monthExpenses.forEach((expense) => {
      categoryMap[expense.category] = (categoryMap[expense.category] || 0) + (parseFloat(expense.amount) || 0)
    })
    if (totalWages > 0) {
      categoryMap.Wages = (categoryMap.Wages || 0) + totalWages
    }
    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))

    const budgetTable = budget
      ? Object.entries(budget.categories).map(([category, budgeted]) => {
          const expenseActual = monthExpenses
            .filter((expense) => expense.category === category)
            .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
          const actual = category === 'Wages' ? expenseActual + totalWages : expenseActual
          const variance = parseFloat(budgeted) - actual
          const pct = budgeted > 0 ? Math.min((actual / parseFloat(budgeted)) * 100, 100) : 0
          return { cat: category, budgeted: parseFloat(budgeted), actual, variance, pct }
        })
      : []

    const recent = [...expenses].sort(sortByDateDesc).slice(0, 5)

    return {
      totalExpenses,
      totalWages,
      net: 0 - totalExpenses - totalWages,
      budgetRemaining,
      last6,
      pieData,
      budgetTable,
      recent,
    }
  }, [budgets, currentMonth, expenses, wages])

  const totalUsers = Storage.getUsers().filter((user) => user.active).length

  const cardHead = (title, action, actionLabel) => (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>
        {title}
      </h2>
      {action && (
        <button onClick={action} style={{ fontSize: '12px', color: '#c8785a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
          {actionLabel}
        </button>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading finance overview...</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }} className="lg:grid-cols-4">
        {STAT_CFG.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={fmt(data[card.key])}
            sub={card.sub}
            overBudget={card.key === 'budgetRemaining' && data.budgetRemaining < 0}
            bg={card.bg}
            color={card.color}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="lg:grid-cols-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {cardHead('Monthly Expenses - Last 6 Months')}
          <div style={{ padding: '16px 20px 20px' }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={data.last6} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => fmt(value)}
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="amount" fill="#E8956D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {cardHead(`Expense Breakdown - ${currentMonth}`)}
          <div style={{ padding: '16px 20px 20px' }}>
            {data.pieData.length === 0 ? (
              <div style={{ height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>
                No expenses this month
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={data.pieData} cx="50%" cy="50%" outerRadius={78} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={11}>
                    {data.pieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => fmt(value)} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {data.budgetTable.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {cardHead(`Budget vs Actual - ${currentMonth}`)}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  {['Category', 'Budgeted', 'Actual', 'Variance', '% Used'].map((heading, index) => (
                    <th key={heading} style={{ padding: '10px 16px', fontWeight: 600, color: '#6b7280', textAlign: index > 0 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.budgetTable.map((row) => (
                  <tr key={row.cat} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: '#111827' }}>{row.cat}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: '#6b7280' }}>{fmt(row.budgeted)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500, color: '#374151' }}>{fmt(row.actual)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: row.variance >= 0 ? '#16a34a' : '#e11d48' }}>
                      {row.variance >= 0 ? '+' : ''}{fmt(row.variance)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '99px', height: '6px', minWidth: '60px' }}>
                          <div style={{ width: `${row.pct}%`, height: '6px', borderRadius: '99px', background: row.pct >= 100 ? '#e11d48' : row.pct >= 80 ? '#f59e0b' : '#22c55e' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#9ca3af', width: '30px', textAlign: 'right' }}>{row.pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {cardHead('Recent Expenses', onNavigate ? () => onNavigate('expenses') : null, 'View all')}
        <div style={{ padding: '8px 0' }}>
          {data.recent.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '32px 20px' }}>No expenses recorded yet.</p>
          ) : (
            data.recent.map((expense, index) => (
              <div key={expense.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px',
                borderBottom: index < data.recent.length - 1 ? '1px solid #f9fafb' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.description}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>{expense.date} · {expense.category}</p>
                </div>
                <span style={{ fontWeight: 600, color: '#374151', fontSize: '13px', flexShrink: 0 }}>{fmt(expense.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Active system users: {totalUsers}</p>
      </div>
    </div>
  )
}
