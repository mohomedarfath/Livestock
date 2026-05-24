import { useState, useEffect } from 'react'
import { useCurrency } from '../utils/currency.jsx'
import { useConfirm } from '../components/ui'

export default function MedicineLog() {
  const { fmt, currency } = useCurrency()
  const confirm = useConfirm()
  const [medicines, setMedicines] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    flockName: '',
    dateGiven: new Date().toISOString().split('T')[0],
    batchNumber: '',
    cost: '',
    withdrawalDays: '',
    notes: '',
  })

  useEffect(() => {
    const savedMedicines = localStorage.getItem('clucktrack_medicinelog')
    if (savedMedicines) {
      setMedicines(JSON.parse(savedMedicines))
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name || !formData.dosage || !formData.flockName.trim()) {
      setFormError('Please fill all required fields')
      return
    }
    if (formData.cost && parseFloat(formData.cost) < 0) {
      setFormError('Cost cannot be negative')
      return
    }
    if (formData.withdrawalDays && parseInt(formData.withdrawalDays) < 0) {
      setFormError('Withdrawal days cannot be negative')
      return
    }
    setFormError('')

    const dateGiven = new Date(formData.dateGiven)
    const withdrawalDate = new Date(dateGiven)
    withdrawalDate.setDate(withdrawalDate.getDate() + (parseInt(formData.withdrawalDays) || 0))

    const newMedicine = {
      id: Date.now(),
      name: formData.name,
      dosage: formData.dosage,
      flockName: formData.flockName,
      dateGiven: formData.dateGiven,
      batchNumber: formData.batchNumber,
      cost: parseFloat(formData.cost) || 0,
      withdrawalDays: parseInt(formData.withdrawalDays) || 0,
      withdrawalDate: withdrawalDate.toISOString().split('T')[0],
      notes: formData.notes,
    }

    const updated = [...medicines, newMedicine]
    setMedicines(updated)
    localStorage.setItem('clucktrack_medicinelog', JSON.stringify(updated))

    setFormData({
      name: '',
      dosage: '',
      flockName: '',
      dateGiven: new Date().toISOString().split('T')[0],
      batchNumber: '',
      cost: '',
      withdrawalDays: '',
      notes: '',
    })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete medicine record?',
      description: 'This removes the medicine entry and withdrawal information.',
      confirmLabel: 'Delete record',
      destructive: true,
    })
    if (!confirmed) return
    const updated = medicines.filter(m => m.id !== id)
    setMedicines(updated)
    localStorage.setItem('clucktrack_medicinelog', JSON.stringify(updated))
  }

  const today = new Date().toISOString().split('T')[0]

  // Separate active and expired withdrawals
  const activeWithdrawals = medicines.filter(m => m.withdrawalDate >= today)
  const expiredWithdrawals = medicines.filter(m => m.withdrawalDate < today)
  const totalCost = medicines.reduce((sum, m) => sum + m.cost, 0)

  const daysRemaining = (withdrawalDate) => {
    const today = new Date()
    const endDate = new Date(withdrawalDate)
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Medicine Log</h1>
        <p className="text-[var(--text-muted)] text-sm">Track medicines and withdrawal periods</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Total Records</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-600 mt-1">{medicines.length}</p>
        </div>

        <div className="card bg-gradient-to-br from-pink-50 to-pink-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Total Cost</p>
          <p className="text-2xl md:text-3xl font-bold text-pink-600 mt-1">{fmt(totalCost.toFixed(0))}</p>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Active Withdrawal</p>
          <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">{activeWithdrawals.length}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Withdrawal Done</p>
          <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">{expiredWithdrawals.length}</p>
        </div>
      </div>

      {/* Add Medicine Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="btn-primary w-full mb-6"
      >
        {showForm ? '✕ Cancel' : '➕ Log Medicine'}
      </button>

      {/* Add Medicine Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-farm-orange bg-opacity-10 border-2 border-farm-orange mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Medicine Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Ampicillin, Cocci-Guard"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Dosage
                </label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g., 500mg, 2ml/L"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Flock Name
                </label>
                <input
                  type="text"
                  name="flockName"
                  value={formData.flockName}
                  onChange={handleChange}
                  placeholder="e.g., Flock A"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Date Given
                </label>
                <input
                  type="date"
                  name="dateGiven"
                  value={formData.dateGiven}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Batch/Lot Number
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  placeholder="e.g., LOT-2026-001"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Withdrawal Period (Days)
                </label>
                <input
                  type="number"
                  name="withdrawalDays"
                  value={formData.withdrawalDays}
                  onChange={handleChange}
                  placeholder="e.g., 7"
                  className="input-field"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Cost ({currency.symbol})
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
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
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any notes about this medicine"
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
              Save Medicine Record
            </button>
          </div>
        </form>
      )}

      {/* Active Withdrawal Periods */}
      {activeWithdrawals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#ef4444] mb-3">⚠️ Active Withdrawal Periods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeWithdrawals.map(med => {
              const remaining = daysRemaining(med.withdrawalDate)
              return (
                <div key={med.id} className="card border-2 border-red-500" style={{ background: 'color-mix(in srgb, #ef4444 10%, var(--surface-2))' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-[#ef4444]">{med.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Flock: {med.flockName}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(med.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2 text-sm bg-[var(--surface)] p-2 rounded">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Given</p>
                      <p className="font-medium">{new Date(med.dateGiven).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Safe to Sell In</p>
                      <p className="font-bold text-red-700">{remaining} days</p>
                    </div>
                  </div>

                  <div className="text-xs p-2 rounded border border-red-500 text-red-700" style={{ background: 'color-mix(in srgb, #ef4444 15%, var(--surface))' }}>
                    🚫 <span className="font-bold">DO NOT SELL EGGS</span> until {new Date(med.withdrawalDate).toLocaleDateString('en-IN')}
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Dosage: {med.dosage} | Batch: {med.batchNumber}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed Withdrawal Periods */}
      {expiredWithdrawals.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#10b981] mb-3">✓ Withdrawal Period Complete</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiredWithdrawals.map(med => (
              <div key={med.id} className="card border-l-4 border-green-500 opacity-75" style={{ background: 'color-mix(in srgb, #10b981 10%, var(--surface-2))' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[#10b981]">{med.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Flock: {med.flockName}</p>
                    <p className="text-xs text-green-700 mt-2 font-semibold">
                      ✓ Safe to sell since {new Date(med.withdrawalDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(med.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {medicines.length === 0 && (
        <div className="card bg-blue-50 text-center py-8">
          <p className="text-[var(--text-muted)] text-sm">No medicines recorded yet. Start by adding a medicine record.</p>
        </div>
      )}
    </div>
  )
}
