import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { expenseRepository } from '../services/repositories/expenseRepository'

export function useExpenses() {
  const { currentOrganization } = useTenant()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextExpenses = await expenseRepository.list(currentOrganization?.id)
      setExpenses(nextExpenses)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load expenses.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createExpense(expense) {
    const created = await expenseRepository.create(currentOrganization?.id, expense)
    setExpenses((current) => [created, ...current])
    return created
  }

  async function removeExpense(expenseId) {
    await expenseRepository.remove(currentOrganization?.id, expenseId)
    setExpenses((current) => current.filter((expense) => expense.id !== expenseId))
  }

  return { expenses, loading, error, createExpense, removeExpense, reload }
}
