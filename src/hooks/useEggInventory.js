import { useCallback, useEffect, useState } from 'react'
import { eggInventoryRepository } from '../services/repositories/eggInventoryRepository'

export function useEggInventory() {
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)

    try {
      const nextInventory = await eggInventoryRepository.getInventory()
      setInventory(nextInventory)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load egg inventory.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function updateSettings(settings) {
    const nextInventory = await eggInventoryRepository.updateSettings(settings)
    setInventory(nextInventory)
    return nextInventory
  }

  async function recordMovement(movement) {
    const nextInventory = await eggInventoryRepository.recordMovement(movement)
    setInventory(nextInventory)
    return nextInventory
  }

  return { inventory, loading, error, reload, updateSettings, recordMovement }
}
