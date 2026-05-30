import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { shopOrdersRepository } from '../services/repositories/shopOrdersRepository'

export function useShopOrders() {
  const { currentOrganization } = useTenant()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextOrders = await shopOrdersRepository.list(currentOrganization?.id)
      setOrders(nextOrders)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load shop orders.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createOrder(order) {
    const created = await shopOrdersRepository.create(currentOrganization?.id, order)
    setOrders((current) => [created, ...current])
    return created
  }

  return { orders, loading, error, reload, createOrder }
}
