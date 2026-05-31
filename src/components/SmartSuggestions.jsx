import { useMemo } from 'react'
import { useEmployees } from '../hooks/useEmployees'
import { useEmployeeActivities } from '../hooks/useEmployeeActivities'
import { useFlocks } from '../hooks/useFlocks'
import { useExpenses } from '../hooks/useExpenses'
import { useBudgets } from '../hooks/useBudgets'
import { useAnimalType } from '../animal/useAnimalType'

// Generate smart, actionable tips from farm data
function buildSuggestions(role, { employees, activities, flocks, expenses, budgets, animalTypeDetails }) {
  const tips = []
  const today = new Date().toISOString().split('T')[0]
  const hour  = new Date().getHours()
  const dow   = new Date().getDay() // 0=Sun

  const todayActs = activities.filter((a) => a.date === today)

  // ── Critical alerts (red) ────────────────────────────────────
  const noShows = employees.filter((emp) => !todayActs.some((a) => a.employeeId === emp.id))
  if (noShows.length > 0 && (role === 'admin' || role === 'manager')) {
    tips.push({
      level: 'alert',
      icon: '⚠️',
      title: `${noShows.length} employee${noShows.length > 1 ? 's' : ''} haven't logged work today`,
      body: noShows.map((e) => e.name).join(', '),
      action: 'View Employees',
      page: 'activities',
    })
  }

  if (flocks.length === 0) {
    tips.push({
      level: 'alert',
      icon: '🐔',
      title: `No ${animalTypeDetails.groupPlural.toLowerCase()} set up yet`,
      body: `Add your first ${animalTypeDetails.groupLabel.toLowerCase()} to start tracking feed, health checks, and daily work.`,
      action: `Add ${animalTypeDetails.groupLabel}`,
      page: 'flocks',
    })
  }

  // ── Egg stock alerts ─────────────────────────────────────────
  const eggInv = JSON.parse(localStorage.getItem('clucktrack_eggs') || 'null')
  if (eggInv && eggInv.stock <= eggInv.threshold) {
    tips.push({
      level: 'alert',
      icon: '🥚',
      title: `Egg stock is low — only ${eggInv.stock} ${eggInv.unit} left`,
      body: `Your alert threshold is ${eggInv.threshold} ${eggInv.unit}. Record collections or adjust threshold in Farm Inventory.`,
      action: 'Farm Inventory',
      page: 'inventory',
    })
  }

  // ── Feed stock alerts ─────────────────────────────────────────
  const feedStock = JSON.parse(localStorage.getItem('clucktrack_feed_stock') || 'null')
  if (feedStock && feedStock.kgOnHand <= feedStock.threshold && feedStock.lastUpdated) {
    tips.push({
      level: feedStock.kgOnHand === 0 ? 'alert' : 'warning',
      icon: '🌾',
      title: feedStock.kgOnHand === 0 ? 'Feed stock is empty!' : `Feed stock is low — ${feedStock.kgOnHand} kg remaining`,
      body: feedStock.kgOnHand === 0
        ? 'Order feed immediately to prevent disruption to your flock.'
        : `You have ${feedStock.kgOnHand} kg left, below your ${feedStock.threshold} kg alert threshold.`,
      action: 'Feed Tracker',
      page: 'feed',
    })
  }

  // ── Medicine stock alerts ─────────────────────────────────────
  const medStock = JSON.parse(localStorage.getItem('clucktrack_med_stock') || '[]')
  const lowMeds = medStock.filter(m => m.quantity <= m.threshold)
  if (lowMeds.length > 0) {
    tips.push({
      level: 'warning',
      icon: '💊',
      title: `${lowMeds.length} medicine${lowMeds.length > 1 ? 's' : ''} running low`,
      body: lowMeds.map(m => m.name).join(', '),
      action: 'Medicine Log',
      page: 'medicine',
    })
  }

  // ── Hatch day alerts (incubation) ─────────────────────────────
  const incubations = JSON.parse(localStorage.getItem('clucktrack_incubations') || '[]')
  const soonHatch = incubations.filter(b => {
    if (b.status !== 'incubating') return false
    const start = new Date(b.startDate)
    const hatch = new Date(start)
    hatch.setDate(hatch.getDate() + 21)
    const today2 = new Date()
    const daysLeft = Math.ceil((hatch - today2) / (1000 * 60 * 60 * 24))
    return daysLeft <= 3 && daysLeft >= 0
  })
  if (soonHatch.length > 0) {
    tips.push({
      level: 'alert',
      icon: '🐣',
      title: `Hatch day approaching for ${soonHatch.length} batch${soonHatch.length > 1 ? 'es' : ''}!`,
      body: soonHatch.map(b => b.batchName).join(', ') + ' — prepare brooder and check incubator.',
      action: 'Incubation',
      page: 'incubation',
    })
  }

  // ── Budget warnings (yellow) ─────────────────────────────────
  if (role === 'admin' || role === 'accountant') {
    const month = today.slice(0, 7)
    const budget = budgets.find((b) => b.month === month)
    if (budget) {
      const monthExpenses = expenses.filter((e) => e.date.startsWith(month))
      Object.entries(budget.categories).forEach(([cat, limit]) => {
        if (!limit) return
        const spent = monthExpenses.filter((e) => e.category === cat).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
        const pct = (spent / limit) * 100
        if (pct >= 100) {
          tips.push({
            level: 'warning',
            icon: '💸',
            title: `${cat} budget is over the limit!`,
            body: `Spent ${Math.round(pct)}% of the monthly ${cat} budget.`,
            action: 'Review Expenses',
            page: 'expenses',
          })
        } else if (pct >= 80) {
          tips.push({
            level: 'warning',
            icon: '📊',
            title: `${cat} budget is ${Math.round(pct)}% used`,
            body: `Only ${Math.round(100 - pct)}% of the ${cat} budget remains this month.`,
            action: 'Review Budget',
            page: 'budgets',
          })
        }
      })
    }
  }

  // ── Positive tips (green) ────────────────────────────────────
  if (todayActs.length > 0 && noShows.length === 0 && employees.length > 0) {
    tips.push({
      level: 'good',
      icon: '✅',
      title: 'All employees logged work today!',
      body: `${todayActs.length} activities completed across ${employees.length} employees.`,
      action: null,
    })
  }

  // ── Helpful daily tips (blue) ────────────────────────────────
  const dailyTips = [
    { icon: '🌡️', title: 'Check flock health today', body: 'Early detection saves birds. Walk through each pen and look for unusual behavior.' },
    { icon: '💧', title: 'Check water systems', body: 'Ensure all drinkers are clean and working. Dehydration is a top cause of low egg production.' },
    { icon: '📦', title: 'Review feed stock levels', body: 'Running low on feed can hurt production. Check inventory and plan your next order.' },
    { icon: '🥚', title: 'Track egg quality today', body: 'Record any cracked, dirty, or unusually small eggs — this can signal a health issue.' },
    { icon: '🧹', title: 'Coop cleaning reminder', body: 'Clean coops reduce disease risk. Aim for thorough cleaning at least once a week.' },
    { icon: '💡', title: 'Check lighting schedules', body: 'Proper lighting (14–16 hrs/day) boosts egg production. Verify your timers are set correctly.' },
    { icon: '🔒', title: 'Security check', body: 'Inspect fencing and doors for gaps. Predators are most active at night.' },
  ]
  if (animalTypeDetails.id !== 'poultry') {
    dailyTips[0] = {
      icon: 'Health',
      title: `Check ${animalTypeDetails.healthSubject} health today`,
      body: `Early detection protects your ${animalTypeDetails.animalPlural.toLowerCase()}. Walk through each area and look for unusual behavior.`,
    }
    dailyTips[1] = {
      icon: 'Water',
      title: 'Check water systems',
      body: `Ensure all troughs and drinkers are clean and working for your ${animalTypeDetails.animalPlural.toLowerCase()}.`,
    }
    dailyTips[3] = {
      icon: 'Stock',
      title: `Review ${animalTypeDetails.productLabel.toLowerCase()}`,
      body: 'Check inventory and sales stock so field records match what is available.',
    }
    dailyTips[5] = {
      icon: 'Routine',
      title: 'Review feeding routine',
      body: 'Make sure feed quantity, minerals, and grazing plans match the current group size.',
    }
  }
  tips.push({ level: 'tip', ...dailyTips[(dow + (hour > 12 ? 1 : 0)) % dailyTips.length] })

  // ── Morning nudge ────────────────────────────────────────────
  if (hour < 9) {
    tips.push({
      level: 'tip',
      icon: '🌅',
      title: 'Good morning! Start the day strong.',
      body: 'Morning feed, water checks, and egg collection should be the first tasks of the day.',
      action: null,
    })
  } else if (hour >= 17) {
    tips.push({
      level: 'tip',
      icon: '🌙',
      title: 'Evening wrap-up',
      body: 'Make sure all activities are logged before end of day. Close up coops to protect your flock overnight.',
      action: null,
    })
  }

  return tips.slice(0, 5) // show max 5
}

const LEVEL_STYLE = {
  alert:   { bg: 'color-mix(in srgb, var(--accent) 10%, var(--surface))', border: 'color-mix(in srgb, var(--accent) 30%, transparent)', icon_bg: 'color-mix(in srgb, var(--accent) 20%, var(--surface))', color: 'var(--accent)', label: 'Urgent' },
  warning: { bg: 'color-mix(in srgb, #d97706 10%, var(--surface))', border: 'color-mix(in srgb, #d97706 30%, transparent)', icon_bg: 'color-mix(in srgb, #d97706 20%, var(--surface))', color: '#d97706', label: 'Heads Up' },
  good:    { bg: 'color-mix(in srgb, #16a34a 10%, var(--surface))', border: 'color-mix(in srgb, #16a34a 30%, transparent)', icon_bg: 'color-mix(in srgb, #16a34a 20%, var(--surface))', color: '#16a34a', label: 'Great' },
  tip:     { bg: 'var(--surface-2)', border: 'var(--border)', icon_bg: 'var(--accent-bg)', color: 'var(--text)', label: 'Tip' },
}

export default function SmartSuggestions({ role, onNavigate }) {
  const { employees } = useEmployees()
  const { activities } = useEmployeeActivities()
  const { flocks } = useFlocks()
  const { expenses } = useExpenses()
  const { budgets } = useBudgets()
  const { animalTypeDetails } = useAnimalType()

  const tips = useMemo(
    () =>
      buildSuggestions(role, {
        employees: employees.filter((employee) => employee.active),
        activities,
        flocks,
        expenses,
        budgets,
        animalTypeDetails,
      }),
    [activities, animalTypeDetails, budgets, employees, expenses, flocks, role]
  )

  if (tips.length === 0) return null

  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '.04em', opacity: .7 }}>
        <span>💡</span> Smart Suggestions
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tips.map((tip, i) => {
          const s = LEVEL_STYLE[tip.level] || LEVEL_STYLE.tip
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '12px 14px', borderRadius: '10px',
                background: s.bg, border: `1px solid ${s.border}`,
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: s.icon_bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>
                {tip.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: s.color }}>{tip.title}</p>
                  <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '99px', background: s.icon_bg, color: s.color, fontWeight: 600, flexShrink: 0 }}>
                    {s.label}
                  </span>
                </div>
                {tip.body && <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip.body}</p>}
              </div>
              {tip.action && onNavigate && (
                <button
                  onClick={() => onNavigate(tip.page)}
                  style={{
                    flexShrink: 0, fontSize: '12px', fontWeight: 600, padding: '6px 12px',
                    borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: s.icon_bg, color: s.color, whiteSpace: 'nowrap',
                    transition: 'filter .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(.93)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  {tip.action} →
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
