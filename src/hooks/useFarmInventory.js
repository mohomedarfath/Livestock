import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { farmInventoryRepository } from '../services/repositories/farmInventoryRepository'

export function useFarmInventory() {
  const { currentOrganization } = useTenant()
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)

    try {
      const nextInventory = await farmInventoryRepository.getInventory(currentOrganization?.id)
      setInventory(nextInventory)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load farm inventory.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createItem(item) {
    const nextInventory = await farmInventoryRepository.createItem(currentOrganization?.id, item)
    setInventory(nextInventory)
    return nextInventory
  }

  async function updateItem(itemId, updates) {
    const nextInventory = await farmInventoryRepository.updateItem(currentOrganization?.id, itemId, updates)
    setInventory(nextInventory)
    return nextInventory
  }

  async function recordMovement(itemId, movement) {
    const nextInventory = await farmInventoryRepository.recordMovement(currentOrganization?.id, itemId, movement)
    setInventory(nextInventory)
    return nextInventory
  }

  async function applySale(itemId, sale) {
    const nextInventory = await farmInventoryRepository.applySale(currentOrganization?.id, itemId, sale)
    setInventory(nextInventory)
    return nextInventory
  }

  return {
    inventory,
    loading,
    error,
    reload,
    createItem,
    updateItem,
    recordMovement,
    applySale,
  }
}
