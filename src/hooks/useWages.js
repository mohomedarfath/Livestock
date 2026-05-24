import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { wageRepository } from '../services/repositories/wageRepository'

export function useWages() {
  const { currentOrganization } = useTenant()
  const [wages, setWages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextWages = await wageRepository.list(currentOrganization?.id)
      setWages(nextWages)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load wages.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function saveWagesForMonth(month, rows) {
    await wageRepository.saveMonth(currentOrganization?.id, month, rows)
    await reload()
  }

  async function markWagePaid(employeeId, month, payload) {
    await wageRepository.markPaid(currentOrganization?.id, employeeId, month, payload)
    await reload()
  }

  return { wages, loading, error, reload, saveWagesForMonth, markWagePaid }
}
