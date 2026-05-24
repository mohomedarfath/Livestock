import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { organizationSettingsRepository } from '../services/repositories/organizationSettingsRepository'
import { tenantRepository } from '../services/repositories/tenantRepository'

const DEFAULT_SETTINGS = {
  farmName: 'LivestockTrack Pro',
  logo: null,
  currency: 'LKR',
  address: '',
  enabledAnimalTypes: ['poultry', 'goat', 'cow'],
  defaultAnimalType: 'poultry',
}

export function useOrganizationSettings() {
  const { currentOrganization, refreshAccess } = useTenant()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)

    try {
      const nextSettings = await organizationSettingsRepository.get(
        currentOrganization?.id,
        currentOrganization?.name || DEFAULT_SETTINGS.farmName
      )
      setSettings(nextSettings)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load farm settings.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id, currentOrganization?.name])

  useEffect(() => {
    reload()
  }, [reload])

  async function saveSettings(nextSettings) {
    const savedSettings = await organizationSettingsRepository.save(
      currentOrganization?.id,
      nextSettings,
      currentOrganization?.name || DEFAULT_SETTINGS.farmName
    )

    if (currentOrganization?.id && savedSettings.farmName?.trim() && savedSettings.farmName !== currentOrganization?.name) {
      await tenantRepository.updateOrganization(currentOrganization.id, {
        name: savedSettings.farmName,
      })
      await refreshAccess()
    }

    setSettings(savedSettings)
    setError('')
    return savedSettings
  }

  return { settings, loading, error, reload, saveSettings }
}
