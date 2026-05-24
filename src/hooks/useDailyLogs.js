import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { dailyLogRepository } from '../services/repositories/dailyLogRepository'

export function useDailyLogs() {
  const { currentOrganization } = useTenant()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)

    try {
      const nextLogs = await dailyLogRepository.list(currentOrganization?.id)
      setLogs(nextLogs)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load daily logs.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  return { logs, loading, error, reload }
}
