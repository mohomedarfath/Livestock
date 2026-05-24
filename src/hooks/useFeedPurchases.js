import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { feedPurchaseRepository } from '../services/repositories/feedPurchaseRepository'

export function useFeedPurchases() {
  const { currentOrganization } = useTenant()
  const [feedPurchases, setFeedPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextFeedPurchases = await feedPurchaseRepository.list(currentOrganization?.id)
      setFeedPurchases(nextFeedPurchases)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load feed purchases.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createFeedPurchase(purchase) {
    const created = await feedPurchaseRepository.create(currentOrganization?.id, purchase)
    setFeedPurchases((current) => [created, ...current])
    return created
  }

  return { feedPurchases, loading, error, reload, createFeedPurchase }
}
