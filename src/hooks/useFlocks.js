import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { flockRepository } from '../services/repositories/flockRepository'

export function useFlocks() {
  const { currentOrganization } = useTenant()
  const [flocks, setFlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextFlocks = await flockRepository.list(currentOrganization?.id)
      setFlocks(nextFlocks)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load flocks.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createFlock(flock) {
    const created = await flockRepository.create(currentOrganization?.id, flock)
    setFlocks((current) => [...current, created])
    return created
  }

  async function removeFlock(flockId) {
    await flockRepository.remove(currentOrganization?.id, flockId)
    setFlocks((current) => current.filter((flock) => flock.id !== flockId))
  }

  return { flocks, loading, error, createFlock, removeFlock, reload }
}
