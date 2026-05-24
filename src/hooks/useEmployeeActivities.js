import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { activityRepository } from '../services/repositories/activityRepository'

export function useEmployeeActivities() {
  const { currentOrganization } = useTenant()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextActivities = await activityRepository.list(currentOrganization?.id)
      setActivities(nextActivities)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load activities.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createActivity(activity) {
    const created = await activityRepository.create(currentOrganization?.id, activity)
    setActivities((current) => [created, ...current])
    return created
  }

  return { activities, loading, error, reload, createActivity }
}
