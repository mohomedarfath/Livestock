import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useDailyLogs } from '../hooks/useDailyLogs'
import { useSales } from '../hooks/useSales'
import { useFlocks } from '../hooks/useFlocks'
import { useEmployeeActivities } from '../hooks/useEmployeeActivities'
import { useFeedPurchases } from '../hooks/useFeedPurchases'
import { useExpenses } from '../hooks/useExpenses'
import { ChartCard } from './ui'
import { useAnimalType } from '../animal/AnimalTypeContext'

// ── helpers ────────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
function shortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CHART_CARD = {
  borderRadius: '14px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  padding: '18px 20px',
}
const CHART_TITLE = {
  margin: '0 0 4px',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--text)',
}
const CHART_SUB = {
  margin: '0 0 16px',
  fontSize: '11px',
  color: 'var(--text-dim)',
}

const TOOLTIP_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  fontSize: '12px',
  color: 'var(--text)',
  boxShadow: '0 4px 16px rgba(0,0,0,.12)',
}

// ── 1. Egg Production — last 7 days line chart ─────────────────────────────────
export function EggProductionChart() {
  const { logs } = useDailyLogs()

  const data = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i))

    // collect unique flock names
    const flockNames = [...new Set(logs.map(l => l.flockName).filter(Boolean))]

    return days.map(date => {
      const row = { date: shortDate(date) }
      let total = 0
      flockNames.forEach(name => {
        const sum = logs
          .filter(l => l.date === date && l.flockName === name)
          .reduce((s, l) => s + (parseInt(l.eggs, 10) || 0), 0)
        row[name] = sum
        total += sum
      })
      row['Total'] = total
      return row
    })
  }, [logs])

  const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899']
  const flocks = Object.keys(data[0] || {}).filter(k => k !== 'date' && k !== 'Total')

  return (
    <div style={CHART_CARD}>
      <p style={CHART_TITLE}>🥚 Egg Production — Last 7 Days</p>
      <p style={CHART_SUB}>Daily eggs collected per flock</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <defs>
            {flocks.map((name, i) => (
              <linearGradient key={name} id={`eggGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
            <linearGradient id="eggTotalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          {flocks.length > 1 ? flocks.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              fill={`url(#eggGrad${i})`}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
              activeDot={{ r: 5 }}
            />
          )) : (
            <Area
              type="monotone"
              dataKey="Total"
              stroke="#f97316"
              fill="url(#eggTotalGrad)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#f97316' }}
              activeDot={{ r: 5 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── 2. Sales Revenue — last 14 days bar chart ──────────────────────────────────
export function SalesRevenueChart() {
  const { sales } = useSales()

  const data = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => daysAgo(13 - i))
    return days.map(date => {
      const daySales = sales.filter(s => s.date === date)
      return {
        date: shortDate(date),
        Eggs:  daySales.filter(s => s.type === 'eggs').reduce((s, x) => s + (x.totalPrice || 0), 0),
        Birds: daySales.filter(s => s.type === 'live_birds').reduce((s, x) => s + (x.totalPrice || 0), 0),
        Meat:  daySales.filter(s => s.type === 'meat').reduce((s, x) => s + (x.totalPrice || 0), 0),
      }
    }).filter(d => d.Eggs + d.Birds + d.Meat > 0 || true) // show all days
  }, [sales])

  return (
    <div style={CHART_CARD}>
      <p style={CHART_TITLE}>💰 Sales Revenue — Last 14 Days</p>
      <p style={CHART_SUB}>Revenue by product type</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} interval={1} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey="Eggs"  fill="#f97316" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Birds" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Meat"  fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── 3. Daily Tasks — last 7 days bar chart ─────────────────────────────────────
export function TasksChart() {
  const { activities } = useEmployeeActivities()

  const data = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i))
    return days.map(date => {
      const dayActs = activities.filter(a => a.date === date)
      const hours   = dayActs.reduce((s, a) => s + (parseFloat(a.hours) || 0), 0)
      return {
        date:  shortDate(date),
        Tasks: dayActs.length,
        Hours: parseFloat(hours.toFixed(1)),
      }
    })
  }, [activities])

  return (
    <div style={CHART_CARD}>
      <p style={CHART_TITLE}>📋 Daily Work — Last 7 Days</p>
      <p style={CHART_SUB}>Tasks logged and hours worked</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey="Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Hours" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── 4. Feed Cost Trend — last 6 purchases line chart ──────────────────────────
export function FeedCostChart() {
  const { feedPurchases } = useFeedPurchases()

  const data = useMemo(() => {
    return [...feedPurchases]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-8)
      .map(e => ({
        date:       shortDate(e.date),
        'Total (₹)': e.totalPrice || 0,
        'Kg':        e.kg || 0,
      }))
  }, [feedPurchases])

  return (
    <div style={CHART_CARD}>
      <p style={CHART_TITLE}>🌾 Feed Cost Trend</p>
      <p style={CHART_SUB}>Last 8 feed purchases</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Line type="monotone" dataKey="Total (₹)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Kg" stroke="#84cc16" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: '#84cc16' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── 5. Flock Population Bar Chart ─────────────────────────────────────────────
export function FlockPopulationChart() {
  const { flocks } = useFlocks()
  const { animalTypeDetails } = useAnimalType()

  const data = useMemo(() => {
    return flocks.map(f => ({
      name:   f.name,
      [animalTypeDetails.animalPlural]:  f.count || 0,
    }))
  }, [animalTypeDetails.animalPlural, flocks])

  const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899']

  return (
    <div style={CHART_CARD}>
      <p style={CHART_TITLE}>🐔 Flock Population</p>
      <p style={CHART_SUB}>Current {animalTypeDetails.animalPlural.toLowerCase()} count per {animalTypeDetails.groupLabel.toLowerCase()}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 60, bottom: 0 }} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} width={56} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey={animalTypeDetails.animalPlural} radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FCRTrendChart() {
  const { logs } = useDailyLogs()

  const data = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i))
    return days.map((date) => {
      const dayLogs = logs.filter((log) => log.date === date)
      const feed = dayLogs.reduce((sum, log) => sum + (parseFloat(log.feed || log.feedGiven) || 0), 0)
      const eggs = dayLogs.reduce((sum, log) => sum + (parseFloat(log.eggs || log.eggsCollected) || 0), 0)

      return {
        date: shortDate(date),
        'Feed / egg': eggs > 0 ? Number((feed / eggs).toFixed(2)) : 0,
        'Feed kg': Number(feed.toFixed(1)),
      }
    })
  }, [logs])

  return (
    <ChartCard title="FCR Trend" subtitle="Estimated feed efficiency from daily logs">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Line type="monotone" dataKey="Feed / egg" stroke="var(--chart-violet)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--chart-violet)' }} />
          <Line type="monotone" dataKey="Feed kg" stroke="var(--chart-green)" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: 'var(--chart-green)' }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function ProfitLossBarChart() {
  const { sales } = useSales()
  const { expenses } = useExpenses()
  const { feedPurchases } = useFeedPurchases()

  const data = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const revenue = sales
        .filter((sale) => String(sale.date || '').startsWith(monthKey))
        .reduce((sum, sale) => sum + (parseFloat(sale.totalPrice) || 0), 0)
      const expenseTotal = expenses
        .filter((expense) => String(expense.date || '').startsWith(monthKey))
        .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
      const feedCost = feedPurchases
        .filter((purchase) => String(purchase.date || '').startsWith(monthKey))
        .reduce((sum, purchase) => sum + (parseFloat(purchase.totalPrice) || 0), 0)
      const costs = expenseTotal + feedCost

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        Revenue: Number(revenue.toFixed(0)),
        Costs: Number(costs.toFixed(0)),
        Profit: Number((revenue - costs).toFixed(0)),
      }
    })
  }, [expenses, feedPurchases, sales])

  return (
    <ChartCard title="Profit / Loss - Last 6 Months" subtitle="Revenue, costs, and net position">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey="Revenue" fill="var(--chart-green)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Costs" fill="var(--chart-red)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Profit" fill="var(--chart-blue)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
