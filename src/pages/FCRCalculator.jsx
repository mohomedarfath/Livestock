import { useState, useEffect } from 'react'
import { useConfirm } from '../components/ui'

export default function FCRCalculator() {
  const confirm = useConfirm()
  const [flocks, setFlocks] = useState([])
  const [selectedFlockId, setSelectedFlockId] = useState(null)
  const [fcrRecords, setFcrRecords] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    flockId: null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    feedConsumed: '',
    weightGained: '',
    birdsAlive: '',
    notes: '',
  })

  useEffect(() => {
    const savedFlocks = localStorage.getItem('clucktrack_flocks')
    if (savedFlocks) {
      setFlocks(JSON.parse(savedFlocks))
    }

    const savedRecords = localStorage.getItem('clucktrack_fcr')
    if (savedRecords) {
      setFcrRecords(JSON.parse(savedRecords))
    }
  }, [])

  // Breed FCR Standards
  const breedsStandards = {
    'Broiler': 1.5,
    'Broiler Starter': 1.3,
    'Broiler Grower': 1.5,
    'Broiler Finisher': 1.7,
    'Layer': 2.0,
    'Cockerel': 2.5,
  }

  const handleFlockSelect = (flockId) => {
    setSelectedFlockId(flockId)
    setFormData(prev => ({
      ...prev,
      flockId: flockId
    }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const calculateFCR = () => {
    if (formData.feedConsumed && formData.weightGained && formData.feedConsumed > 0 && formData.weightGained > 0) {
      return (parseFloat(formData.feedConsumed) / parseFloat(formData.weightGained)).toFixed(2)
    }
    return 'N/A'
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.flockId || !formData.feedConsumed || !formData.weightGained || !formData.birdsAlive) {
      setFormError('Please fill all required fields')
      return
    }
    if (parseFloat(formData.feedConsumed) <= 0 || parseFloat(formData.weightGained) <= 0 || parseInt(formData.birdsAlive) <= 0) {
      setFormError('Feed, weight and birds must be greater than 0')
      return
    }
    if (formData.endDate < formData.startDate) {
      setFormError('End date must be after start date')
      return
    }
    setFormError('')

    const fcr = calculateFCR()
    const selectedFlock = flocks.find(f => f.id === formData.flockId)
    const standard = breedsStandards[selectedFlock?.breed] || 2.0

    const newRecord = {
      id: Date.now(),
      flockId: formData.flockId,
      flockName: selectedFlock?.name,
      breed: selectedFlock?.breed,
      startDate: formData.startDate,
      endDate: formData.endDate,
      feedConsumed: parseFloat(formData.feedConsumed),
      weightGained: parseFloat(formData.weightGained),
      fcr: parseFloat(fcr),
      fcrStandard: standard,
      deviation: (parseFloat(fcr) - standard).toFixed(2),
      birdsAlive: parseInt(formData.birdsAlive),
      avgWeightPerBird: (parseFloat(formData.weightGained) / parseInt(formData.birdsAlive)).toFixed(2),
      notes: formData.notes,
    }

    const updated = [...fcrRecords, newRecord]
    setFcrRecords(updated)
    localStorage.setItem('clucktrack_fcr', JSON.stringify(updated))

    setFormData({
      flockId: selectedFlockId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      feedConsumed: '',
      weightGained: '',
      birdsAlive: '',
      notes: '',
    })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete FCR record?',
      description: 'This feed conversion record will be permanently removed.',
      confirmLabel: 'Delete record',
      destructive: true,
    })
    if (!confirmed) return
    const updated = fcrRecords.filter(r => r.id !== id)
    setFcrRecords(updated)
    localStorage.setItem('clucktrack_fcr', JSON.stringify(updated))
  }

  const selectedFlock = flocks.find(f => f.id === selectedFlockId)
  const selectedFcrRecords = fcrRecords.filter(r => r.flockId === selectedFlockId)
  const averageFCR = selectedFcrRecords.length > 0
    ? (selectedFcrRecords.reduce((sum, r) => sum + r.fcr, 0) / selectedFcrRecords.length).toFixed(2)
    : 'N/A'

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">FCR Calculator</h1>
        <p className="text-[var(--text-muted)] text-sm">Feed Conversion Ratio - Track feed efficiency</p>
      </div>

      {/* Flock Selector */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">Select Flock</h2>

        {flocks.length === 0 ? (
          <div className="card bg-blue-50 text-center py-8">
            <p className="text-[var(--text-muted)] text-sm">No flocks available. Add a flock first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            {flocks.map(flock => (
              <button
                key={flock.id}
                onClick={() => handleFlockSelect(flock.id)}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedFlockId === flock.id
                    ? 'border-farm-orange bg-farm-orange bg-opacity-10'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-farm-orange'
                }`}
              >
                <div className="font-bold text-[var(--text)]">{flock.name}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{flock.breed}</div>
                <div className="text-xs text-[var(--text-muted)]">Standard FCR: {breedsStandards[flock.breed] || 2.0}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedFlock && (
        <>
          {/* Current Flock Summary */}
          <div className="space-y-3 mb-6">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-[var(--text-muted)] text-sm font-medium">{selectedFlock.name} - Total Records</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{selectedFcrRecords.length}</p>
            </div>

            {selectedFcrRecords.length > 0 && (
              <>
                <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
                  <p className="text-[var(--text-muted)] text-sm font-medium">Average FCR</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{averageFCR}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Standard: {breedsStandards[selectedFlock.breed] || 2.0}
                    {averageFCR !== 'N/A' && (parseFloat(averageFCR) - (breedsStandards[selectedFlock.breed] || 2.0) > 0 ? ' · ❌ Below Standard' : ' · ✓ Good')}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Add FCR Record Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary w-full mb-6"
          >
            {showForm ? '✕ Cancel' : '➕ Add FCR Record'}
          </button>

          {/* Add FCR Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="card bg-farm-orange bg-opacity-10 border-2 border-farm-orange mb-6">
              <div className="space-y-4">
                <div className="bg-blue-100 p-3 rounded border border-blue-300 text-sm">
                  <p className="font-bold text-blue-900 mb-1">📊 What is FCR?</p>
                  <p className="text-blue-800 text-xs">
                    Feed Conversion Ratio = Total Feed Consumed ÷ Total Weight Gained.
                    Lower FCR is better. Standard for {selectedFlock.breed}: {breedsStandards[selectedFlock.breed] || 2.0}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      Total Feed Consumed (kg)
                    </label>
                    <input
                      type="number"
                      name="feedConsumed"
                      value={formData.feedConsumed}
                      onChange={handleChange}
                      placeholder="0"
                      className="input-field"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      Total Weight Gained (kg)
                    </label>
                    <input
                      type="number"
                      name="weightGained"
                      value={formData.weightGained}
                      onChange={handleChange}
                      placeholder="0"
                      className="input-field"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    Birds Alive (During Period)
                  </label>
                  <input
                    type="number"
                    name="birdsAlive"
                    value={formData.birdsAlive}
                    onChange={handleChange}
                    placeholder="0"
                    className="input-field"
                    min="0"
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
                    placeholder="Any notes about this period"
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
                  Calculate & Save FCR
                </button>
              </div>
            </form>
          )}

          {/* FCR Records */}
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] mb-3">
              FCR Records ({selectedFcrRecords.length})
            </h2>

            {selectedFcrRecords.length === 0 ? (
              <div className="card bg-blue-50 text-center py-8">
                <p className="text-[var(--text-muted)] text-sm">No FCR records yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...selectedFcrRecords].reverse().map(record => {
                  const isGood = record.fcr <= record.fcrStandard
                  return (
                    <div
                      key={record.id}
                      className={`card border-l-4 ${isGood ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-[var(--text)]">
                            {new Date(record.startDate).toLocaleDateString('en-IN')} - {new Date(record.endDate).toLocaleDateString('en-IN')}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{record.breed}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>

                      {/* FCR Display */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className={`p-3 rounded text-center ${isGood ? 'bg-green-100' : 'bg-red-100'}`}>
                          <p className="text-xs text-[var(--text-muted)]">FCR Achieved</p>
                          <p className={`text-2xl font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                            {record.fcr}
                          </p>
                        </div>

                        <div className="p-3 rounded bg-[var(--surface-2)] text-center">
                          <p className="text-xs text-[var(--text-muted)]">Standard</p>
                          <p className="text-2xl font-bold text-[var(--text-muted)]">{record.fcrStandard}</p>
                        </div>

                        <div className={`p-3 rounded text-center ${record.deviation < 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                          <p className="text-xs text-[var(--text-muted)]">Deviation</p>
                          <p className={`text-lg font-bold ${record.deviation < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {record.deviation > 0 ? '+' : ''}{record.deviation}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="bg-[var(--surface)] p-2 rounded text-sm space-y-1 border border-[var(--border)]">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Feed Consumed</span>
                          <span className="font-medium">{record.feedConsumed}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Weight Gained</span>
                          <span className="font-medium">{record.weightGained}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Avg Weight/Bird</span>
                          <span className="font-medium">{record.avgWeightPerBird}kg</span>
                        </div>
                      </div>

                      {record.notes && (
                        <p className="text-xs text-[var(--text-muted)] mt-2 border-t pt-2 italic">📌 {record.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* FCR Educational Info */}
      <div className="mt-6 card bg-yellow-50 border-l-4 border-yellow-400">
        <h3 className="font-bold text-yellow-900 mb-2">💡 FCR Tips</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• FCR is crucial for profitability - lower is better</li>
          <li>• Calculate weekly or bi-weekly for accuracy</li>
          <li>• Poor FCR indicates: disease, bad feed, or hot weather</li>
          <li>• Track feed wastage and leakage to improve FCR</li>
          <li>• Compare your FCR to breed standards</li>
        </ul>
      </div>
    </div>
  )
}
