import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { budgetRepository } from '../services/repositories/budgetRepository'

export function useBudgets() {
  const { currentOrganization } = useTenant()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextBudgets = await budgetRepository.list(currentOrganization?.id)
      setBudgets(nextBudgets)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load budgets.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function saveBudgetMonth(month, categories) {
    await budgetRepository.saveMonth(currentOrganization?.id, month, categories)
    await reload()
  }

  return { budgets, loading, error, reload, saveBudgetMonth }
}
