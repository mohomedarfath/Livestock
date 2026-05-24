import { useCallback, useEffect, useState } from 'react'
import { isLegacyUserManagementEnabled, userRepository } from '../services/repositories/userRepository'
import { useTenant } from '../context/TenantContext'

export function useUsers() {
  const { currentOrganization } = useTenant()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!isLegacyUserManagementEnabled) {
      setUsers([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const nextUsers = await userRepository.list()
      setUsers(nextUsers)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [currentOrganization?.id, reload])

  async function saveUser(user, editingId) {
    const nextUsers = await userRepository.upsert(user, editingId)
    setUsers(nextUsers)
    return nextUsers
  }

  async function toggleUserActive(userId) {
    const nextUsers = await userRepository.toggleActive(userId)
    setUsers(nextUsers)
    return nextUsers
  }

  return { users, loading, error, saveUser, toggleUserActive, reload }
}
