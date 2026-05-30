import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { shopCustomersRepository } from '../services/repositories/shopCustomersRepository'

export function useShopCustomers() {
  const { currentOrganization } = useTenant()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextCustomers = await shopCustomersRepository.list(currentOrganization?.id)
      setCustomers(nextCustomers)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load shop customers.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createCustomer(customer) {
    const created = await shopCustomersRepository.create(currentOrganization?.id, customer)
    setCustomers((current) => [...current, created].sort((left, right) => left.name.localeCompare(right.name)))
    return created
  }

  async function updateCustomer(customerId, updates) {
    const nextCustomers = await shopCustomersRepository.update(currentOrganization?.id, customerId, updates)
    setCustomers(nextCustomers)
    return nextCustomers
  }

  async function removeCustomer(customerId) {
    const nextCustomers = await shopCustomersRepository.remove(currentOrganization?.id, customerId)
    setCustomers(nextCustomers)
    return nextCustomers
  }

  return { customers, loading, error, reload, createCustomer, updateCustomer, removeCustomer }
}
