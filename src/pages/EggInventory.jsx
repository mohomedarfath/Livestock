import { useEffect, useMemo, useState } from 'react'
import { useCurrency } from '../utils/currency.jsx'
import { useEggInventory } from '../hooks/useEggInventory'
import { EGG_UNITS, formatEggQuantity, fromEggPieces, normalizeEggUnit, toEggPieces } from '../utils/eggInventory'

const MANUAL_TRANSACTION_TYPES = {
  collected: {
    label: 'Collected',
    icon: '🥚',
    color: '#16a34a',
    bg: '#f0fdf4',
    description: 'Add eggs collected from the flock.',
  },
  broken: {
    label: 'Broken / Lost',
    icon: '💔',
    color: '#dc2626',
    bg: '#fef2f2',
    description: 'Remove damaged or spoiled eggs from stock.',
  },
  adjustment: {
    label: 'Manual Add',
    icon: '📦',
    color: '#d97706',
    bg: '#fffbeb',
    description: 'Increase stock after a stock-count correction.',
  },
}

function Card({ children, style = {} }) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  )
}

function initialForm(displayUnit = 'trays') {
  return {
    type: 'collected',
    quantity: '',
    unit: normalizeEggUnit(displayUnit),
    date: new Date().toISOString().split('T')[0],
    notes: '',
  }
}

export default function EggInventory({ onNavigate }) {
  const { fmt } = useCurrency()
  const { inventory, loading, error, recordMovement, updateSettings } = useEggInventory()
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [formError, setFormError] = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [form, setForm] = useState(initialForm())
  const [settings, setSettings] = useState({ displayUnit: 'trays', lowStockThreshold: '10' })

  useEffect(() => {
    if (!inventory) return

    setSettings({
      displayUnit: inventory.displayUnit,
      lowStockThreshold: String(fromEggPieces(inventory.lowStockThresholdPieces, inventory.displayUnit)),
    })

    setForm((current) => ({
      ...current,
      unit: current.unit || inventory.displayUnit,
    }))
  }, [inventory])

  const monthlyStats = useMemo(() => {
    if (!inventory) {
      return {
        collectedPieces: 0,
        soldPieces: 0,
        brokenPieces: 0,
        revenue: 0,
      }
    }

    const currentMonth = new Date().toISOString().slice(0, 7)
    const thisMonthTransactions = inventory.transactions.filter((transaction) => transaction.date.startsWith(currentMonth))

    return thisMonthTransactions.reduce(
      (summary, transaction) => {
        if (transaction.type === 'collected' || transaction.type === 'adjustment') {
          summary.collectedPieces += transaction.quantityPieces
        }

        if (transaction.type === 'sold') {
          summary.soldPieces += transaction.quantityPieces
          summary.revenue += Number(transaction.totalPrice || 0)
        }

        if (transaction.type === 'broken') {
          summary.brokenPieces += transaction.quantityPieces
        }

        return summary
      },
      {
        collectedPieces: 0,
        soldPieces: 0,
        brokenPieces: 0,
        revenue: 0,
      }
    )
  }, [inventory])

  const recentTransactions = inventory?.transactions.slice(0, 20) || []
  const isLowStock = inventory ? inventory.stockPieces <= inventory.lowStockThresholdPieces : false

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    try {
      await recordMovement({
        type: form.type,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        date: form.date,
        notes: form.notes.trim(),
        source: 'egg-inventory',
      })

      setForm(initialForm(inventory?.displayUnit || form.unit))
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save egg inventory movement.')
    }
  }

  async function handleSaveSettings() {
    setSettingsError('')

    try {
      await updateSettings({
        displayUnit: settings.displayUnit,
        lowStockThreshold: parseFloat(settings.lowStockThreshold),
      })
      setShowSettings(false)
    } catch (err) {
      setSettingsError(err.message || 'Failed to save egg inventory settings.')
    }
  }

  if (loading && !inventory) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="card text-center py-8">
          <p className="text-sm text-[var(--text-muted)]">Loading egg inventory...</p>
        </div>
      </div>
    )
  }

  if (!inventory) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
          {error || 'Egg inventory is unavailable right now.'}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text)' }}>Egg Inventory</h1>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Track collected eggs, live stock on hand, and how much you sold.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowSettings((value) => !value)} className="btn-secondary">
            Settings
          </button>
          {onNavigate && (
            <button onClick={() => onNavigate('sales')} className="btn-secondary">
              Sales Log
            </button>
          )}
          <button onClick={() => setShowForm((value) => !value)} className="btn-primary">
            {showForm ? 'Cancel' : 'Record Movement'}
          </button>
        </div>
      </div>

      <Card style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-dim)' }}>
              Shared Workflow
            </p>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
              Daily Log adds collected eggs to inventory, and egg sales recorded in Sales Log automatically reduce stock.
            </p>
          </div>
          <div style={{ color: isLowStock ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
            {isLowStock ? 'Low stock alert' : 'Inventory healthy'}
          </div>
        </div>
      </Card>

      {(error || formError || settingsError) && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
          {formError || settingsError || error}
        </div>
      )}

      {showSettings && (
        <Card>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Inventory Settings</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Display Unit
              </label>
              <select
                value={settings.displayUnit}
                onChange={(event) => setSettings((current) => ({ ...current, displayUnit: event.target.value }))}
                className="input-field"
              >
                {Object.entries(EGG_UNITS).map(([unitKey, unitValue]) => (
                  <option key={unitKey} value={unitKey}>
                    {unitValue.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Low Stock Threshold ({settings.displayUnit})
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={settings.lowStockThreshold}
                onChange={(event) => setSettings((current) => ({ ...current, lowStockThreshold: event.target.value }))}
                className="input-field"
                placeholder="10"
              />
            </div>
          </div>
          <button onClick={handleSaveSettings} className="btn-primary" style={{ marginTop: '16px' }}>
            Save Settings
          </button>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <Card style={{ background: isLowStock ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isLowStock ? '#fecaca' : '#bbf7d0'}` }}>
          <p style={{ margin: 0, fontSize: '12px', color: isLowStock ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
            {isLowStock ? 'LOW STOCK' : 'CURRENT STOCK'}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: '38px', fontWeight: 800, lineHeight: 1, color: isLowStock ? '#dc2626' : '#16a34a' }}>
            {inventory.stock}
          </p>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>{inventory.displayUnit}</p>
          <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
            Threshold: {inventory.threshold} {inventory.displayUnit}
          </p>
        </Card>

        <Card>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Collected This Month
          </p>
          <p style={{ margin: '10px 0 0', fontSize: '30px', fontWeight: 800, color: '#16a34a' }}>
            {fromEggPieces(monthlyStats.collectedPieces, inventory.displayUnit)}
          </p>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>{inventory.displayUnit}</p>
        </Card>

        <Card>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Sold This Month
          </p>
          <p style={{ margin: '10px 0 0', fontSize: '30px', fontWeight: 800, color: '#2563eb' }}>
            {fromEggPieces(monthlyStats.soldPieces, inventory.displayUnit)}
          </p>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>{inventory.displayUnit}</p>
        </Card>

        <Card>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Egg Revenue This Month
          </p>
          <p style={{ margin: '10px 0 0', fontSize: '30px', fontWeight: 800, color: '#d97706' }}>
            {fmt(monthlyStats.revenue.toFixed(0))}
          </p>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
            Broken/lost: {fromEggPieces(monthlyStats.brokenPieces, inventory.displayUnit)} {inventory.displayUnit}
          </p>
        </Card>
      </div>

      {showForm && (
        <Card>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Record Egg Movement</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Movement Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                {Object.entries(MANUAL_TRANSACTION_TYPES).map(([typeKey, typeValue]) => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, type: typeKey }))}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: `1px solid ${form.type === typeKey ? typeValue.color : 'var(--border)'}`,
                      background: form.type === typeKey ? typeValue.bg : 'var(--surface-2)',
                      color: form.type === typeKey ? typeValue.color : 'var(--text-muted)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: '18px' }}>{typeValue.icon}</div>
                    <div style={{ fontWeight: 700, marginTop: '6px' }}>{typeValue.label}</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{typeValue.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Unit
                </label>
                <select
                  value={form.unit}
                  onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                  className="input-field"
                >
                  {Object.entries(EGG_UNITS).map(([unitKey, unitValue]) => (
                    <option key={unitKey} value={unitKey}>
                      {unitValue.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
              This will {form.type === 'broken' ? 'remove' : 'add'} {form.quantity || 0} {form.unit} ({toEggPieces(form.quantity, form.unit)} pieces)
              {form.type === 'broken' && ` from the current stock of ${formatEggQuantity(inventory.stockPieces, form.unit)}.`}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="input-field"
                placeholder="Morning collection, cracked eggs, stock count correction..."
              />
            </div>

            <button type="submit" className="btn-primary">
              Save Movement
            </button>
          </form>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Recent Egg Movements</h2>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '36px' }}>🥚</p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>No egg inventory records yet. Start with a daily log or a manual movement.</p>
          </div>
        ) : (
          recentTransactions.map((transaction, index) => {
            const transactionType = MANUAL_TRANSACTION_TYPES[transaction.type] || {
              label: 'Sold',
              icon: '🛒',
              color: '#2563eb',
              bg: '#eff6ff',
            }
            const isOutbound = transaction.type === 'sold' || transaction.type === 'broken'

            return (
              <div
                key={transaction.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 20px',
                  borderBottom: index < recentTransactions.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: transactionType.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  {transactionType.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>{transactionType.label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {transaction.buyerName ? `${transaction.buyerName} • ` : ''}
                    {transaction.source === 'sales-log'
                      ? 'Recorded from Sales Log'
                      : transaction.source === 'daily-log'
                        ? 'Recorded from Daily Log'
                        : 'Manual inventory update'}
                  </p>
                  {transaction.notes && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>{transaction.notes}</p>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: isOutbound ? '#dc2626' : '#16a34a' }}>
                    {isOutbound ? '-' : '+'}
                    {fromEggPieces(transaction.quantityPieces, inventory.displayUnit)} {inventory.displayUnit}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>{transaction.date}</p>
                  {transaction.totalPrice > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#2563eb' }}>{fmt(transaction.totalPrice.toFixed(0))}</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}
