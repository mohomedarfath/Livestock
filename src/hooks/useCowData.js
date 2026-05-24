import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import {
  cowBreedingRepository,
  cowHealthRepository,
  cowMilkLogRepository,
  cowRepository,
  milkPaymentRepository,
} from '../services/repositories/cowRepository'

function useRepository(repository, errorMessage) {
  const { currentOrganization } = useTenant()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextRecords = await repository.list(currentOrganization?.id)
      setRecords(nextRecords)
      setError('')
    } catch (err) {
      setError(err.message || errorMessage)
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id, errorMessage, repository])

  useEffect(() => {
    reload()
  }, [reload])

  const create = useCallback(async (record) => {
    const created = await repository.create(currentOrganization?.id, record)
    setRecords((current) => [created, ...current])
    return created
  }, [currentOrganization?.id, repository])

  const remove = useCallback(async (recordId) => {
    await repository.remove(currentOrganization?.id, recordId)
    setRecords((current) => current.filter((record) => record.id !== recordId))
  }, [currentOrganization?.id, repository])

  return { records, loading, error, reload, create, remove }
}

export function useCows() {
  const result = useRepository(cowRepository, 'Failed to load cows.')
  return {
    cows: result.records,
    loading: result.loading,
    error: result.error,
    reload: result.reload,
    createCow: result.create,
    removeCow: result.remove,
  }
}

export function useCowMilkLogs() {
  const result = useRepository(cowMilkLogRepository, 'Failed to load milk logs.')
  return {
    milkLogs: result.records,
    loading: result.loading,
    error: result.error,
    reload: result.reload,
    createMilkLog: result.create,
    removeMilkLog: result.remove,
  }
}

export function useCowBreedingRecords() {
  const result = useRepository(cowBreedingRepository, 'Failed to load breeding records.')
  return {
    breedingRecords: result.records,
    loading: result.loading,
    error: result.error,
    reload: result.reload,
    createBreedingRecord: result.create,
    removeBreedingRecord: result.remove,
  }
}

export function useCowHealthRecords() {
  const result = useRepository(cowHealthRepository, 'Failed to load health records.')
  return {
    healthRecords: result.records,
    loading: result.loading,
    error: result.error,
    reload: result.reload,
    createHealthRecord: result.create,
    removeHealthRecord: result.remove,
  }
}

export function useMilkPayments() {
  const result = useRepository(milkPaymentRepository, 'Failed to load milk payments.')
  return {
    milkPayments: result.records,
    loading: result.loading,
    error: result.error,
    reload: result.reload,
    createMilkPayment: result.create,
    removeMilkPayment: result.remove,
  }
}
