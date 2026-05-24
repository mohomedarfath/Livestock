import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { vaccinationRepository } from '../services/repositories/vaccinationRepository'

export function useVaccinations() {
  const { currentOrganization } = useTenant()
  const [vaccinations, setVaccinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextVaccinations = await vaccinationRepository.list(currentOrganization?.id)
      setVaccinations(nextVaccinations)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load vaccinations.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createVaccination(vaccination) {
    const created = await vaccinationRepository.create(currentOrganization?.id, vaccination)
    setVaccinations((current) => [...current, created])
    return created
  }

  async function updateVaccinationStatus(vaccinationId, status) {
    await vaccinationRepository.updateStatus(currentOrganization?.id, vaccinationId, status)
    setVaccinations((current) =>
      current.map((vaccination) =>
        vaccination.id === vaccinationId ? { ...vaccination, status } : vaccination
      )
    )
  }

  async function removeVaccination(vaccinationId) {
    await vaccinationRepository.remove(currentOrganization?.id, vaccinationId)
    setVaccinations((current) =>
      current.filter((vaccination) => vaccination.id !== vaccinationId)
    )
  }

  return {
    vaccinations,
    loading,
    error,
    createVaccination,
    updateVaccinationStatus,
    removeVaccination,
    reload,
  }
}
