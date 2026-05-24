import { useMemo, useState } from 'react'
import { useConfirm } from '../../components/ui'
import { useCowBreedingRecords, useCowHealthRecords, useCowMilkLogs, useCows } from '../../hooks/useCowData'
import { COW_BREEDS, COW_STATUSES, formatDate, logsForCow, statusLabel, sumLitres, todayIso } from './cowUtils'

const EMPTY_FORM = {
  name: '',
  tagNumber: '',
  breed: '',
  dateOfBirth: '',
  status: 'milking',
  lactationNumber: '',
  lastCalvingDate: '',
  purchasePrice: '',
  notes: '',
}

export default function CowHerdManager() {
  const confirm = useConfirm()
  const { cows, loading, error, createCow, removeCow } = useCows()
  const { milkLogs } = useCowMilkLogs()
  const { breedingRecords } = useCowBreedingRecords()
  const { healthRecords } = useCowHealthRecords()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [selectedCowId, setSelectedCowId] = useState(null)

  const herdStats = useMemo(() => {
    const active = cows.filter((cow) => !['sold', 'dead'].includes(cow.status))
    const inMilk = cows.filter((cow) => cow.status === 'milking')
    const pregnant = cows.filter((cow) => cow.status === 'pregnant')
    return { active, inMilk, pregnant }
  }, [cows])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.name.trim() || !formData.tagNumber.trim() || !formData.breed) {
      setFormError('Cow name, tag number, and breed are required.')
      return
    }

    await createCow({
      ...formData,
      name: formData.name.trim(),
      tagNumber: formData.tagNumber.trim(),
      lactationNumber: Number(formData.lactationNumber || 0),
      purchasePrice: Number(formData.purchasePrice || 0),
    })

    setFormData(EMPTY_FORM)
    setShowForm(false)
  }

  const handleDelete = async (cow) => {
    const confirmed = await confirm({
      title: 'Delete cow?',
      description: `This removes ${cow.name} from the cow section. Existing milk, breeding, and health records will remain for audit history.`,
      confirmLabel: 'Delete cow',
      destructive: true,
    })
    if (!confirmed) return
    await removeCow(cow.id)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Cow Profiles</h1>
          <p className="text-[var(--text-muted)] text-sm">Manage each cow by tag, breed, lactation, milk, breeding, and health history.</p>
        </div>
        <button type="button" onClick={() => setShowForm((value) => !value)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Cow'}
        </button>
      </div>

      {error && (
        <div className="card mb-4" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#b42318' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Active</p>
          <p className="text-2xl font-bold text-[#2563eb]">{herdStats.active.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">In milk</p>
          <p className="text-2xl font-bold text-[#059669]">{herdStats.inMilk.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Pregnant</p>
          <p className="text-2xl font-bold text-[#d97706]">{herdStats.pregnant.length}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Cow Name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="e.g., Lakshmi" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Tag / Ear Number</label>
              <input name="tagNumber" value={formData.tagNumber} onChange={handleChange} className="input-field" placeholder="e.g., C-027" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Breed</label>
              <select name="breed" value={formData.breed} onChange={handleChange} className="input-field">
                <option value="">Select breed</option>
                {COW_BREEDS.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                {COW_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Lactation Number</label>
              <input type="number" min="0" name="lactationNumber" value={formData.lactationNumber} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Last Calving Date</label>
              <input type="date" name="lastCalvingDate" value={formData.lastCalvingDate} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Purchase Price</label>
              <input type="number" min="0" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field resize-none" rows="3" placeholder="Temperament, source, dam/sire, special care notes" />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
          <button type="submit" className="btn-primary mt-4 w-full md:w-auto">Save Cow</button>
        </form>
      )}

      {loading ? (
        <div className="card text-center py-10">
          <p className="text-sm text-[var(--text-muted)]">Loading cows...</p>
        </div>
      ) : cows.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-sm text-[var(--text-muted)]">No cows yet. Add your first cow to begin logging milk and breeding history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cows.map((cow) => {
            const cowLogs = logsForCow(milkLogs, cow.id)
            const cowBreeding = breedingRecords.filter((record) => String(record.cowId) === String(cow.id))
            const cowHealth = healthRecords.filter((record) => String(record.cowId) === String(cow.id))
            const lastMilkDate = cowLogs[0]?.date
            const isOpen = selectedCowId === cow.id
            const todayMilk = sumLitres(cowLogs.filter((log) => log.date === todayIso()))
            const lifetimeMilk = sumLitres(cowLogs)

            return (
              <div key={cow.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">{cow.name}</h2>
                    <p className="text-sm text-[var(--text-muted)]">Tag {cow.tagNumber} | {cow.breed}</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {statusLabel(cow.status)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-4">
                  <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-xs text-[var(--text-muted)]">Today</p>
                    <p className="font-bold text-[#059669]">{todayMilk.toFixed(1)} L</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-xs text-[var(--text-muted)]">Lifetime</p>
                    <p className="font-bold text-[#2563eb]">{lifetimeMilk.toFixed(1)} L</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-xs text-[var(--text-muted)]">Lactation</p>
                    <p className="font-bold text-[#d97706]">{cow.lactationNumber || 0}</p>
                  </div>
                </div>

                <button type="button" onClick={() => setSelectedCowId(isOpen ? null : cow.id)} className="btn-secondary w-full">
                  {isOpen ? 'Hide Details' : 'View Details'}
                </button>

                {isOpen && (
                  <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <p><span className="text-[var(--text-muted)]">DOB:</span> {formatDate(cow.dateOfBirth)}</p>
                      <p><span className="text-[var(--text-muted)]">Last calving:</span> {formatDate(cow.lastCalvingDate)}</p>
                      <p><span className="text-[var(--text-muted)]">Last milk log:</span> {formatDate(lastMilkDate)}</p>
                      <p><span className="text-[var(--text-muted)]">Health records:</span> {cowHealth.length}</p>
                      <p><span className="text-[var(--text-muted)]">Breeding records:</span> {cowBreeding.length}</p>
                      <p><span className="text-[var(--text-muted)]">Purchase price:</span> {cow.purchasePrice || 0}</p>
                    </div>
                    {cow.notes && <p className="text-[var(--text-muted)]">{cow.notes}</p>}
                    <button type="button" onClick={() => handleDelete(cow)} className="text-sm font-semibold text-red-600">
                      Delete cow
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
