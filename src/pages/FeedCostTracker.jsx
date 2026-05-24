import { useMemo, useState } from 'react'
import { useCurrency } from '../utils/currency.jsx'
import { farmInventoryRepository } from '../services/repositories/farmInventoryRepository'
import { Storage } from '../utils/storage'
import { useFeedPurchases } from '../hooks/useFeedPurchases'
import { useFlocks } from '../hooks/useFlocks'

export default function FeedCostTracker() {
  const { fmt, currency } = useCurrency()
  const { feedPurchases, loading: purchasesLoading, error: purchasesError, createFeedPurchase } = useFeedPurchases()
  const { flocks, loading: flocksLoading, error: flocksError } = useFlocks()

  const [showForm, setShowForm] = useState(false)
  const [feedStock, setFeedStock] = useState(() => Storage.getFeedStock())
  const [editingStock, setEditingStock] = useState(false)
  const [stockInput, setStockInput] = useState(() => String(Storage.getFeedStock().kgOnHand))
  const [threshInput, setThreshInput] = useState(() => String(Storage.getFeedStock().threshold))
  const [formData, setFormData] = useState({
    type: '',
    kg: '',
    pricePerKg: '',
    totalPrice: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [formError, setFormError] = useState('')

  const loading = purchasesLoading || flocksLoading
  const loadError = purchasesError || flocksError

  const feedLog = useMemo(() => {
    return [...feedPurchases].sort((left, right) => {
      if (left.date !== right.date) return String(left.date || '').localeCompare(String(right.date || ''))
      return String(left.createdAt || left.id || '').localeCompare(String(right.createdAt || right.id || ''))
    })
  }, [feedPurchases])

  function handleChange(event) {
    const { name, value } = event.target
    const updates = { [name]: value }

    if ((name === 'kg' || name === 'pricePerKg') && value) {
      const kg = name === 'kg' ? parseFloat(value) : parseFloat(formData.kg)
      const pricePerKg = name === 'pricePerKg' ? parseFloat(value) : parseFloat(formData.pricePerKg)
      if (kg && pricePerKg) {
        updates.totalPrice = (kg * pricePerKg).toFixed(2)
      }
    }

    setFormData((current) => ({
      ...current,
      ...updates,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!formData.type || !formData.kg || !formData.pricePerKg) {
      setFormError('Please fill all required fields')
      return
    }
    if (parseFloat(formData.kg) <= 0 || parseFloat(formData.pricePerKg) <= 0) {
      setFormError('Quantity and price must be greater than 0')
      return
    }
    setFormError('')

    const newEntry = {
      type: formData.type,
      kg: parseFloat(formData.kg),
      pricePerKg: parseFloat(formData.pricePerKg),
      totalPrice: parseFloat(formData.totalPrice),
      date: formData.date,
      notes: formData.notes,
    }

    try {
      await createFeedPurchase(newEntry)
      await farmInventoryRepository.recordMovement('feed', {
        mode: 'add',
        quantity: newEntry.kg,
        date: newEntry.date,
        notes: `Feed purchase: ${newEntry.type}`,
        source: 'feed-tracker',
      })

      const refreshedStock = Storage.getFeedStock()
      setFeedStock(refreshedStock)
      setStockInput(String(refreshedStock.kgOnHand))
      setThreshInput(String(refreshedStock.threshold))

      setFormData({
        type: '',
        kg: '',
        pricePerKg: '',
        totalPrice: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setShowForm(false)
    } catch (error) {
      setFormError(error.message || 'Failed to save feed purchase.')
    }
  }

  function exportCSV() {
    if (feedLog.length === 0) return

    const headers = ['Date', 'Feed Type', 'Quantity (kg)', 'Price/kg', 'Total Price', 'Notes']
    const rows = [...feedLog].reverse().map((item) => [
      item.date,
      item.type,
      item.kg,
      item.pricePerKg,
      item.totalPrice,
      item.notes || '',
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    anchor.download = `feed_purchases_${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
  }

  const totalFeedKg = feedLog.reduce((sum, item) => sum + (item.kg || 0), 0)
  const totalCost = feedLog.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  const avgCostPerKg = totalFeedKg > 0 ? (totalCost / totalFeedKg).toFixed(2) : '0.00'

  const totalBirds = flocks.reduce((sum, flock) => sum + (flock.count || 0), 0)
  const feedPerBirdPerDay = totalBirds > 0 ? (totalFeedKg / (totalBirds * 30)).toFixed(3) : 0

  const last30Days = feedLog.filter((item) => {
    const itemDate = new Date(item.date)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return itemDate >= thirtyDaysAgo
  })

  const costLast30 = last30Days.reduce((sum, item) => sum + item.totalPrice, 0)
  const kgLast30 = last30Days.reduce((sum, item) => sum + item.kg, 0)
  const avgCostLast30 = kgLast30 > 0 ? (costLast30 / kgLast30).toFixed(2) : 0

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="card text-center py-10">
          <p className="text-sm text-[var(--text-muted)]">Loading feed purchases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Feed Cost Tracker</h1>
        <p className="text-[var(--text-muted)] text-sm">Track feed purchases and costs</p>
      </div>

      {loadError && (
        <div className="card mb-4" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
          {loadError}
        </div>
      )}

      <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '12px', background: feedStock.kgOnHand <= feedStock.threshold ? '#fef2f2' : '#f0fdf4', border: `1px solid ${feedStock.kgOnHand <= feedStock.threshold ? '#fecaca' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: feedStock.kgOnHand <= feedStock.threshold ? '#dc2626' : '#16a34a', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            {feedStock.kgOnHand <= feedStock.threshold ? 'Low Feed Stock' : 'Feed Stock'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '22px', fontWeight: 700, color: feedStock.kgOnHand <= feedStock.threshold ? '#dc2626' : '#16a34a' }}>
            {feedStock.kgOnHand} kg on hand
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>Alert when below {feedStock.threshold} kg</p>
        </div>
        {editingStock ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="number" value={stockInput} onChange={(event) => setStockInput(event.target.value)} placeholder="kg on hand" className="input-field" style={{ width: '110px', fontSize: '13px' }} min="0" />
            <input type="number" value={threshInput} onChange={(event) => setThreshInput(event.target.value)} placeholder="alert threshold" className="input-field" style={{ width: '130px', fontSize: '13px' }} min="0" />
            <button onClick={() => {
              const updated = { kgOnHand: parseFloat(stockInput) || 0, threshold: parseFloat(threshInput) || 50, lastUpdated: new Date().toISOString() }
              setFeedStock(updated)
              Storage.setFeedStock(updated)
              setEditingStock(false)
            }} className="btn-primary" style={{ fontSize: '12px' }}>Save</button>
            <button onClick={() => setEditingStock(false)} className="btn-secondary" style={{ fontSize: '12px' }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditingStock(true)} className="btn-secondary" style={{ fontSize: '12px' }}>Update Stock</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Total Feed (kg)</p>
          <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">{totalFeedKg.toFixed(1)}</p>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Total Cost</p>
          <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">{fmt(totalCost.toFixed(0))}</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Cost/kg (Avg)</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-1">{fmt(avgCostPerKg)}</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Feed/Bird/Day</p>
          <p className="text-2xl md:text-3xl font-bold text-orange-600 mt-1">{feedPerBirdPerDay}kg</p>
        </div>
      </div>

      {last30Days.length > 0 && (
        <div className="card bg-yellow-50 border-2 border-yellow-300 mb-6">
          <h3 className="font-bold text-[var(--text)] mb-2">Last 30 Days</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[var(--text-muted)] text-xs">Feed (kg)</p>
              <p className="font-bold text-yellow-700">{kgLast30.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs">Cost</p>
              <p className="font-bold text-yellow-700">{fmt(costLast30.toFixed(0))}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs">Cost/kg</p>
              <p className="font-bold text-yellow-700">{fmt(avgCostLast30)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex-1"
        >
          {showForm ? 'Cancel' : 'Log Feed Purchase'}
        </button>
        {feedLog.length > 0 && (
          <button onClick={exportCSV} className="btn-secondary px-4">
            CSV
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-farm-orange bg-opacity-10 border-2 border-farm-orange mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Feed Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select feed type</option>
                <option value="Layers Pellets">Layers Pellets</option>
                <option value="Broiler Starter">Broiler Starter</option>
                <option value="Broiler Grower">Broiler Grower</option>
                <option value="Broiler Finisher">Broiler Finisher</option>
                <option value="Grains & Seeds">Grains & Seeds</option>
                <option value="Supplements">Supplements</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  name="kg"
                  value={formData.kg}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-field"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Price/kg ({currency.symbol})
                </label>
                <input
                  type="number"
                  name="pricePerKg"
                  value={formData.pricePerKg}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Total Price ({currency.symbol}) - Auto calculated
              </label>
              <input
                type="number"
                name="totalPrice"
                value={formData.totalPrice}
                readOnly
                placeholder="0"
                className="input-field bg-[var(--surface-2)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any notes about this purchase"
                className="input-field resize-none"
                rows="2"
              />
            </div>

            {formError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-red-700 text-sm">{formError}</p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              Save Purchase
            </button>
          </div>
        </form>
      )}

      <div>
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">
          Feed Purchases ({feedLog.length})
        </h2>

        {feedLog.length === 0 ? (
          <div className="card bg-blue-50 text-center py-8">
            <p className="text-[var(--text-muted)] text-sm">No purchases logged yet. Start by adding a feed purchase.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...feedLog].reverse().map((item) => (
              <div key={item.id} className="card border-l-4 border-farm-orange">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-[var(--text)]">{item.type}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {new Date(item.date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{fmt(item.totalPrice.toFixed(0))}</p>
                    <p className="text-xs text-[var(--text-muted)]">{currency.symbol}{item.pricePerKg}/kg</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm bg-[var(--surface-2)] p-2 rounded">
                  <span className="text-[var(--text)]">{item.kg}kg</span>
                  {item.notes && <span className="text-xs italic text-[var(--text-muted)]">{item.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
