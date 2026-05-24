import { useEffect, useRef, useState } from 'react'
import { useOrganizationSettings } from '../../hooks/useOrganizationSettings'
import { ANIMAL_TYPES, normalizeEnabledAnimalTypes } from '../../animal/animalTypes'

const CURRENCIES = [
  { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
]

function normalizeSettings(settings) {
  const nextCurrency =
    settings.currency === '₹'
      ? 'INR'
      : settings.currency === 'Rs'
        ? 'LKR'
        : settings.currency || 'LKR'

  return {
    ...settings,
    currency: nextCurrency,
    enabledAnimalTypes: normalizeEnabledAnimalTypes(settings.enabledAnimalTypes),
    defaultAnimalType: normalizeEnabledAnimalTypes(settings.enabledAnimalTypes).includes(settings.defaultAnimalType)
      ? settings.defaultAnimalType
      : normalizeEnabledAnimalTypes(settings.enabledAnimalTypes)[0],
  }
}

export default function SystemSettings() {
  const { settings: storedSettings, loading, error: loadError, saveSettings } = useOrganizationSettings()
  const [settings, setSettings] = useState(() => normalizeSettings(storedSettings))
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState({})
  const fileRef = useRef()

  useEffect(() => {
    setSettings(normalizeSettings(storedSettings))
  }, [storedSettings])

  const handleLogoChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrors({ logo: 'Logo file must be under 2MB.' })
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      setSettings((current) => ({ ...current, logo: loadEvent.target.result }))
      setErrors((current) => ({ ...current, logo: '' }))
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const nextErrors = {}
    if (!settings.farmName.trim()) nextErrors.farmName = 'Farm name is required.'
    if (normalizeEnabledAnimalTypes(settings.enabledAnimalTypes).length === 0) {
      nextErrors.enabledAnimalTypes = 'Select at least one animal type.'
    }
    return nextErrors
  }

  const toggleAnimalType = (animalType) => {
    const current = normalizeEnabledAnimalTypes(settings.enabledAnimalTypes)
    const next = current.includes(animalType)
      ? current.filter((type) => type !== animalType)
      : [...current, animalType]
    const enabledAnimalTypes = next.length > 0 ? next : current

    setSettings({
      ...settings,
      enabledAnimalTypes,
      defaultAnimalType: enabledAnimalTypes.includes(settings.defaultAnimalType)
        ? settings.defaultAnimalType
        : enabledAnimalTypes[0],
    })
  }

  const handleSave = async (event) => {
    event.preventDefault()
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    await saveSettings(settings)
    setSuccess('Settings saved successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="w-full max-w-7xl space-y-6 px-4 md:px-6 py-6">
      <h2 className="text-lg font-semibold text-[var(--text)]">Farm Settings</h2>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
          {success}
        </div>
      )}

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
          {loadError}
        </div>
      )}

      <form onSubmit={handleSave} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Farm Name *</label>
          <input
            className="input-field"
            value={settings.farmName}
            onChange={(event) => setSettings({ ...settings, farmName: event.target.value })}
            placeholder="My Poultry Farm"
          />
          {errors.farmName && <p className="text-red-600 text-xs mt-1">{errors.farmName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Farm Logo</label>
          <div className="flex items-center gap-4">
            {settings.logo ? (
              <div className="relative">
                <img
                  src={settings.logo}
                  alt="Farm Logo"
                  className="w-16 h-16 rounded-xl object-cover border-2 border-[var(--border)]"
                />
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, logo: null })}
                  aria-label="Remove farm logo"
                  className="absolute -top-2 -right-2 min-h-10 min-w-10 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[var(--surface-2)] border-2 border-dashed border-[var(--border)] flex items-center justify-center text-2xl">
                Chicken
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="btn-secondary text-sm"
              >
                {settings.logo ? 'Change Logo' : 'Upload Logo'}
              </button>
              <p className="text-xs text-[var(--text-dim)] mt-1">PNG, JPG up to 2MB</p>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          {errors.logo && <p className="text-red-600 text-xs mt-1">{errors.logo}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Default Currency</label>
          <select
            className="input-field"
            value={settings.currency}
            onChange={(event) => setSettings({ ...settings, currency: event.target.value })}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Animal Types</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.values(ANIMAL_TYPES).map((animalType) => {
              const checked = normalizeEnabledAnimalTypes(settings.enabledAnimalTypes).includes(animalType.id)

              return (
                <label
                  key={animalType.id}
                  className="focus-within:shadow-[var(--shadow-focus)] flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                  style={{
                    borderColor: checked ? 'var(--accent)' : 'var(--border)',
                    background: checked ? 'var(--accent-bg)' : 'var(--surface-2)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAnimalType(animalType.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {animalType.label}
                    </span>
                    <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                      {animalType.groupPlural} / {animalType.productLabel}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
          {errors.enabledAnimalTypes && <p className="text-red-600 text-xs mt-1">{errors.enabledAnimalTypes}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Default Animal Type</label>
          <select
            className="input-field"
            value={settings.defaultAnimalType}
            onChange={(event) => setSettings({ ...settings, defaultAnimalType: event.target.value })}
          >
            {normalizeEnabledAnimalTypes(settings.enabledAnimalTypes).map((animalType) => (
              <option key={animalType} value={animalType}>
                {ANIMAL_TYPES[animalType].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">Farm Address</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            value={settings.address || ''}
            onChange={(event) => setSettings({ ...settings, address: event.target.value })}
            placeholder="123 Farm Road, Agriculture District"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Loading...' : 'Save Settings'}
        </button>
      </form>

    </div>
  )
}
