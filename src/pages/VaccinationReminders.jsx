import { useEffect, useMemo, useState } from 'react'
import { useFlocks } from '../hooks/useFlocks'
import { useVaccinations } from '../hooks/useVaccinations'
import { validateVaccination } from '../utils/validation'
import { useConfirm } from '../components/ui'

const EMPTY_FORM = {
  name: '',
  dueDate: '',
  flock: '',
  flockId: '',
  status: 'pending',
}

export default function VaccinationReminders() {
  const confirm = useConfirm()
  const { flocks } = useFlocks()
  const {
    vaccinations,
    loading,
    error,
    createVaccination,
    updateVaccinationStatus,
    removeVaccination,
  } = useVaccinations()

  const [showForm, setShowForm] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [submitState, setSubmitState] = useState('')
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [formData, setFormData] = useState(EMPTY_FORM)

  const pendingVaccinations = useMemo(
    () => vaccinations.filter((vaccination) => vaccination.status === 'pending'),
    [vaccinations]
  )
  const completedVaccinations = useMemo(
    () => vaccinations.filter((vaccination) => vaccination.status === 'completed'),
    [vaccinations]
  )

  function checkAndNotify(items) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    const today = new Date().toISOString().split('T')[0]
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    items
      .filter(
        (vaccination) =>
          vaccination.status === 'pending' &&
          vaccination.dueDate >= today &&
          vaccination.dueDate <= threeDaysFromNow
      )
      .forEach((vaccination) => {
        new Notification('CluckTrack - Vaccination Due Soon', {
          body: `${vaccination.name} for ${vaccination.flock} is due on ${new Date(
            `${vaccination.dueDate}T00:00:00`
          ).toLocaleDateString('en-IN')}`,
          icon: '/icons/icon-192.svg',
        })
      })
  }

  async function requestNotificationPermission() {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
    if (permission === 'granted') checkAndNotify(vaccinations)
  }

  useEffect(() => {
    checkAndNotify(vaccinations)
  }, [vaccinations])

  function handleChange(event) {
    const { name, value } = event.target

    if (name === 'flockId') {
      const selectedFlock = flocks.find((flock) => String(flock.id) === String(value))
      setFormData((current) => ({
        ...current,
        flockId: value,
        flock: selectedFlock?.name || '',
      }))
    } else {
      setFormData((current) => ({ ...current, [name]: value }))
    }

    setFormErrors({})
    setSubmitState('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateVaccination(formData)
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    const payload = {
      name: formData.name,
      dueDate: formData.dueDate,
      flock: formData.flock,
      flockId: formData.flockId || null,
      status: formData.status,
      notes: '',
    }

    try {
      await createVaccination(payload)
      setFormData(EMPTY_FORM)
      setShowForm(false)
      setFormErrors({})
      setSubmitState(navigator.onLine ? 'Vaccination saved successfully.' : 'Vaccination saved offline and will sync when you reconnect.')
    } catch (err) {
      setSubmitState('')
      setFormErrors({ submit: err.message || 'Failed to save vaccination.' })
    }
  }

  async function handleStatusChange(vaccinationId, status) {
    try {
      await updateVaccinationStatus(vaccinationId, status)
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to update vaccination status.' })
    }
  }

  async function handleDelete(vaccinationId) {
    const confirmed = await confirm({
      title: 'Delete vaccination record?',
      description: 'This vaccination reminder will be permanently removed.',
      confirmLabel: 'Delete reminder',
      destructive: true,
    })
    if (!confirmed) return

    try {
      await removeVaccination(vaccinationId)
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to delete vaccination.' })
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = (dateString) => dateString < today

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Vaccination Reminders</h1>
        <p className="text-[var(--text-muted)] text-sm">Repository-backed reminders with cleaner validation and sync flow.</p>
      </div>

      {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
        <div className="card bg-blue-50 border-l-4 border-blue-500 mb-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900 text-sm">Enable reminders</p>
            <p className="text-xs text-blue-700 mt-1">Get notified 3 days before vaccinations are due.</p>
          </div>
          <button onClick={requestNotificationPermission} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 ml-3 whitespace-nowrap">
            Enable
          </button>
        </div>
      )}

      {notifPermission === 'granted' && (
        <div className="card bg-green-50 border-l-4 border-green-500 mb-4">
          <p className="text-sm text-green-800">Notifications are enabled for upcoming vaccination reminders.</p>
        </div>
      )}

      {(submitState || error || formErrors.submit) && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-4"
          style={{
            background: submitState ? '#f0fdf4' : '#fef2f2',
            color: submitState ? '#166534' : '#dc2626',
          }}
        >
          {submitState || formErrors.submit || error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-[var(--text-muted)] text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingVaccinations.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-[var(--text-muted)] text-sm font-medium">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{completedVaccinations.length}</p>
        </div>
      </div>

      <button onClick={() => { setShowForm((value) => !value); setFormErrors({}); }} className="btn-primary w-full mb-6">
        {showForm ? 'Cancel' : '+ Add Vaccination'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card border mb-6" style={{ borderColor: 'var(--accent)' }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Vaccine Name</label>
              <select name="name" value={formData.name} onChange={handleChange} className="input-field">
                <option value="">Select vaccine</option>
                <option value="Newcastle Disease Vaccine">Newcastle Disease Vaccine</option>
                <option value="Infectious Bursal Disease (IBD)">Infectious Bursal Disease (IBD)</option>
                <option value="Avian Influenza Vaccine">Avian Influenza Vaccine</option>
                <option value="Marek's Disease Vaccine">Marek&apos;s Disease Vaccine</option>
                <option value="Coccidiosis Vaccine">Coccidiosis Vaccine</option>
                <option value="Other">Other</option>
              </select>
              {formErrors.name && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Flock</label>
              {flocks.length > 0 ? (
                <select name="flockId" value={formData.flockId} onChange={handleChange} className="input-field">
                  <option value="">Select a flock</option>
                  {flocks.map((flock) => (
                    <option key={flock.id} value={flock.id}>{flock.name}</option>
                  ))}
                </select>
              ) : (
                <input type="text" name="flock" value={formData.flock} onChange={handleChange} placeholder="e.g., Flock Alpha" className="input-field" />
              )}
              {formErrors.flock && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.flock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Due Date</label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="input-field" />
              {formErrors.dueDate && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.dueDate}</p>}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              Save Vaccination
            </button>
          </div>
        </form>
      )}

      {pendingVaccinations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Pending Vaccinations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingVaccinations.map((vaccination) => {
              const overdue = isOverdue(vaccination.dueDate)
              return (
                <div
                  key={vaccination.id}
                  className={`card border-l-4 ${overdue ? 'border-red-500 text-red-700' : 'border-yellow-500 text-yellow-700'}`}
                  style={{ background: `color-mix(in srgb, ${overdue ? '#ef4444' : '#eab308'} 10%, var(--surface-2))` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-[var(--text)]">{vaccination.name}</h3>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Flock: {vaccination.flock}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(vaccination.id)}
                      type="button"
                      aria-label={`Delete vaccination ${vaccination.name}`}
                      className="text-red-600 hover:text-red-800 ml-2 min-h-10 min-w-10"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Due</p>
                      <p className="font-medium text-[var(--text)]">{new Date(`${vaccination.dueDate}T00:00:00`).toLocaleDateString('en-IN')}</p>
                      {overdue && <p className="text-xs text-red-600 font-semibold mt-1">Overdue</p>}
                    </div>
                    <button onClick={() => handleStatusChange(vaccination.id, 'completed')} className="btn-primary text-sm">
                      Mark Done
                    </button>
                  </div>

                  {vaccination.notes && <p className="text-xs text-[var(--text-muted)] border-t pt-2">{vaccination.notes}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {completedVaccinations.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Completed Vaccinations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedVaccinations.map((vaccination) => (
              <div key={vaccination.id} className="card border-l-4 border-green-500 opacity-75" style={{ background: 'color-mix(in srgb, #10b981 10%, var(--surface-2))' }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900">{vaccination.name}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Flock: {vaccination.flock}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-2">Due: {new Date(`${vaccination.dueDate}T00:00:00`).toLocaleDateString('en-IN')}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(vaccination.id)}
                    type="button"
                    aria-label={`Delete vaccination ${vaccination.name}`}
                    className="text-red-600 hover:text-red-800 ml-2 min-h-10 min-w-10"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && vaccinations.length === 0 && (
        <div className="card bg-blue-50 text-center py-8">
          <p className="text-[var(--text-muted)] text-sm">No vaccinations recorded yet.</p>
        </div>
      )}
    </div>
  )
}
