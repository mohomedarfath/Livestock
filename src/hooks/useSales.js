import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { salesRepository } from '../services/repositories/salesRepository'

export function useSales() {
  const { currentOrganization } = useTenant()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextSales = await salesRepository.list(currentOrganization?.id)
      setSales(nextSales)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load sales.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createSale(sale) {
    const created = await salesRepository.create(currentOrganization?.id, sale)
    setSales((current) => [...current, created])
    return created
  }

  return { sales, loading, error, createSale, reload }
}
