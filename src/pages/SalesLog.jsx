import { useMemo, useState } from 'react'
import { useCurrency } from '../utils/currency.jsx'
import { useEggInventory } from '../hooks/useEggInventory'
import { useFarmInventory } from '../hooks/useFarmInventory'
import { EGG_UNITS, fromEggPieces, toEggPieces } from '../utils/eggInventory'
import { useSales } from '../hooks/useSales'
import { validateSale } from '../utils/validation'

const SALE_TYPE_CONFIG = {
  eggs: {
    label: 'Eggs',
    emoji: '🥚',
    unit: 'trays',
    inventoryKind: 'egg',
  },
  live_birds: {
    label: 'Live Birds',
    emoji: '🐔',
    unit: 'birds',
    inventoryKind: 'farm',
    inventoryItemId: 'live_birds',
  },
  chicks: {
    label: 'Chicks',
    emoji: '🐥',
    unit: 'birds',
    inventoryKind: 'farm',
    inventoryItemId: 'chicks',
  },
  meat: {
    label: 'Meat / Dressed Birds',
    emoji: '🍖',
    unit: 'kg',
    inventoryKind: 'farm',
    inventoryItemId: 'meat',
  },
  manure: {
    label: 'Chicken Manure / Compost',
    emoji: '💩',
    unit: 'bags',
    inventoryKind: 'farm',
    inventoryItemId: 'manure',
  },
}

function emptyForm() {
  return {
    type: 'eggs',
    quantity: '',
    unit: SALE_TYPE_CONFIG.eggs.unit,
    pricePerUnit: '',
    totalPrice: '',
    buyerName: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  }
}

export default function SalesLog() {
  const { fmt, currency } = useCurrency()
  const { sales, loading, error, createSale } = useSales()
  const { inventory: eggInventory, recordMovement: recordEggMovement } = useEggInventory()
  const { inventory: farmInventory, applySale } = useFarmInventory()
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [formData, setFormData] = useState(emptyForm())
  const supportsInventoryIntegration = true

  const farmInventoryMap = useMemo(
    () => Object.fromEntries((farmInventory?.items || []).map((item) => [item.id, item])),
    [farmInventory]
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    const updates = { [name]: value }

    if (name === 'type') {
      updates.unit = SALE_TYPE_CONFIG[value]?.unit || 'units'
    }

    if ((name === 'quantity' || name === 'pricePerUnit') && value) {
      const quantity = name === 'quantity' ? parseFloat(value) : parseFloat(formData.quantity)
      const pricePerUnit = name === 'pricePerUnit' ? parseFloat(value) : parseFloat(formData.pricePerUnit)
      if (quantity && pricePerUnit) updates.totalPrice = (quantity * pricePerUnit).toFixed(2)
    }

    setFormData((current) => ({ ...current, ...updates }))
    setFormError('')
    setFormSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateSale(formData)
    if (Object.keys(nextErrors).length > 0) {
      setFormError(Object.values(nextErrors)[0])
      return
    }

    try {
      const saleConfig = SALE_TYPE_CONFIG[formData.type]

      if (supportsInventoryIntegration && saleConfig.inventoryKind === 'egg') {
        const requestedPieces = toEggPieces(formData.quantity, formData.unit)
        if (requestedPieces > (eggInventory?.stockPieces || 0)) {
          const available = eggInventory ? fromEggPieces(eggInventory.stockPieces, formData.unit) : 0
          setFormError(`Not enough egg inventory. Available: ${available} ${formData.unit}.`)
          return
        }
      }

      if (supportsInventoryIntegration && saleConfig.inventoryKind === 'farm') {
        const item = farmInventoryMap[saleConfig.inventoryItemId]
        if (!item) {
          setFormError('This sale item is missing from Farm Inventory.')
          return
        }
        if (Number(formData.quantity) > item.quantity) {
          setFormError(`Not enough ${item.name.toLowerCase()} in stock. Available: ${item.quantity} ${item.unit}.`)
          return
        }
      }

      await createSale({
        type: formData.type,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalPrice: parseFloat(formData.totalPrice),
        buyerName: formData.buyerName.trim(),
        date: formData.date,
        notes: formData.notes,
      })

      if (supportsInventoryIntegration && saleConfig.inventoryKind === 'egg') {
        await recordEggMovement({
          type: 'sold',
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          date: formData.date,
          buyerName: formData.buyerName.trim(),
          unitPrice: parseFloat(formData.pricePerUnit),
          totalPrice: parseFloat(formData.totalPrice),
          source: 'sales-log',
          notes: formData.notes || `Egg sale to ${formData.buyerName.trim()}`,
        })
      }

      if (supportsInventoryIntegration && saleConfig.inventoryKind === 'farm') {
        await applySale(saleConfig.inventoryItemId, {
          quantity: parseFloat(formData.quantity),
          date: formData.date,
          buyerName: formData.buyerName.trim(),
          notes: formData.notes || `${saleConfig.label} sale to ${formData.buyerName.trim()}`,
        })
      }

      setFormData(emptyForm())
      setShowForm(false)
      setFormError('')
      setFormSuccess(
        'Sale recorded successfully.'
      )
    } catch (err) {
      setFormSuccess('')
      setFormError(err.message || 'Failed to record sale')
    }
  }

  const exportCSV = () => {
    if (sales.length === 0) return
    const headers = ['Date', 'Type', 'Quantity', 'Unit', 'Price/Unit', 'Total', 'Buyer', 'Notes']
    const rows = [...sales].reverse().map((sale) =>
      [
        sale.date,
        sale.type,
        sale.quantity,
        sale.unit,
        sale.pricePerUnit,
        sale.totalPrice,
        sale.buyerName,
        sale.notes || '',
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    anchor.download = `sales_${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
  }

  const revenueByType = Object.keys(SALE_TYPE_CONFIG).reduce((summary, type) => {
    summary[type] = sales.filter((sale) => sale.type === type).reduce((sum, sale) => sum + sale.totalPrice, 0)
    return summary
  }, {})

  const eggSoldQuantity = sales
    .filter((sale) => sale.type === 'eggs')
    .reduce((sum, sale) => sum + toEggPieces(sale.quantity, sale.unit), 0)

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0)
  const thisMonth = sales.filter((sale) => {
    const saleDate = new Date(sale.date)
    const today = new Date()
    return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear()
  })
  const thisMonthRevenue = thisMonth.reduce((sum, sale) => sum + sale.totalPrice, 0)

  const currentSaleConfig = SALE_TYPE_CONFIG[formData.type]
  const currentFarmInventoryItem = currentSaleConfig?.inventoryItemId
    ? farmInventoryMap[currentSaleConfig.inventoryItemId]
    : null

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Sales Log</h1>
        <p className="text-[var(--text-muted)] text-sm">
          {supportsInventoryIntegration
            ? 'Record sales and deduct stock from eggs, birds, chicks, meat, and manure inventory.'
            : 'Record sales and deduct stock from eggs, birds, chicks, meat, and manure inventory.'}
        </p>
      </div>

      {(formSuccess || error || formError) && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-4"
          style={{
            background: formSuccess ? '#f0fdf4' : '#fef2f2',
            color: formSuccess ? '#166534' : '#dc2626',
          }}
        >
          {formSuccess || formError || error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Total Revenue</p>
          <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">{fmt(totalRevenue.toFixed(0))}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{sales.length} sales</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">This Month</p>
          <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1">{fmt(thisMonthRevenue.toFixed(0))}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{thisMonth.length} sales</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-6">
        {Object.entries(SALE_TYPE_CONFIG).map(([type, config]) => (
          <div key={type} className="card text-center" style={{ background: 'var(--surface-2)' }}>
            <p className="text-xs text-[var(--text-muted)] font-medium">{config.label}</p>
            <p className="text-xl font-bold text-[var(--accent)] mt-1">{fmt((revenueByType[type] || 0).toFixed(0))}</p>
            {type === 'eggs' ? (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {fromEggPieces(eggSoldQuantity, eggInventory?.displayUnit || 'trays')} {eggInventory?.displayUnit || 'trays'} sold
              </p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] mt-1">{config.unit}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setShowForm((value) => !value)} className="btn-primary flex-1">
          {showForm ? 'Cancel' : '+ Record Sale'}
        </button>
        {sales.length > 0 && (
          <button onClick={exportCSV} className="btn-secondary px-4">
            CSV
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card border mb-6" style={{ borderColor: 'var(--accent)' }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Sale Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="input-field">
                {Object.entries(SALE_TYPE_CONFIG).map(([type, config]) => (
                  <option key={type} value={type}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Quantity</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="0" className="input-field" min="0" step="0.1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Unit</label>
                {formData.type === 'eggs' ? (
                  <select name="unit" value={formData.unit} onChange={handleChange} className="input-field">
                    {Object.entries(EGG_UNITS).map(([unitKey, unitValue]) => (
                      <option key={unitKey} value={unitKey}>
                        {unitValue.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={formData.unit} readOnly className="input-field bg-[var(--surface-2)]" />
                )}
              </div>
            </div>

            {supportsInventoryIntegration && formData.type === 'eggs' && eggInventory && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                Available egg inventory: {fromEggPieces(eggInventory.stockPieces, formData.unit)} {formData.unit}
              </div>
            )}

            {supportsInventoryIntegration && formData.type !== 'eggs' && currentFarmInventoryItem && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                Available {currentFarmInventoryItem.name.toLowerCase()}: {currentFarmInventoryItem.quantity} {currentFarmInventoryItem.unit}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Price per Unit ({currency.symbol})</label>
                <input type="number" name="pricePerUnit" value={formData.pricePerUnit} onChange={handleChange} placeholder="0" className="input-field" min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Total ({currency.symbol})</label>
                <input type="number" value={formData.totalPrice} readOnly className="input-field bg-[var(--surface-2)]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Buyer Name</label>
              <input type="text" name="buyerName" value={formData.buyerName} onChange={handleChange} placeholder="e.g., Retail Shop" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Notes (Optional)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any notes about this sale" className="input-field resize-none" rows="2" />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              Record Sale
            </button>
          </div>
        </form>
      )}

      <div>
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">Recent Sales ({sales.length})</h2>

        {loading ? (
          <div className="card text-center py-8">
            <p className="text-[var(--text-muted)] text-sm">Loading sales...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="card bg-blue-50 text-center py-8">
            <p className="text-[var(--text-muted)] text-sm">No sales recorded yet. Start by adding a sale.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...sales].reverse().map((sale) => {
              const config = SALE_TYPE_CONFIG[sale.type] || SALE_TYPE_CONFIG.eggs
              return (
                <div key={sale.id} className="card border-l-4 border-green-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-[var(--text)]">{config.emoji} {config.label}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Buyer: {sale.buyerName} | {new Date(sale.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{fmt(sale.totalPrice.toFixed(0))}</p>
                      <p className="text-xs text-[var(--text-muted)]">{sale.quantity} {sale.unit}</p>
                    </div>
                  </div>
                  <div className="text-xs bg-[var(--surface-2)] p-2 rounded">
                    {currency.symbol}{sale.pricePerUnit}/unit {sale.notes && `| ${sale.notes}`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
