import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { tenantRepository } from '../services/repositories/tenantRepository'
import {
  accessibleModulesForRole,
  canRoleAccessModule,
  normalizeRoleDefinitions,
  resolveRoleDefinition,
} from '../app/accessControl'

const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState([])
  const [activeMembership, setActiveMembership] = useState(null)
  const [roleDefinitions, setRoleDefinitions] = useState([])
  const [impersonation, setImpersonation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshAccess = useCallback(async () => {
    if (!user?.id) {
      setMemberships([])
      setActiveMembership(null)
      setRoleDefinitions([])
      setImpersonation(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const withTimeout = (promise, ms, msg) =>
      Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms))])

    try {
      const [nextMemberships, nextImpersonation, persistedOrganizationId] = await withTimeout(
        Promise.all([
          tenantRepository.listMemberships(user.id),
          tenantRepository.getImpersonation(),
          tenantRepository.getActiveOrganizationId(),
        ]),
        10000,
        'Loading timed out. Firestore may not be set up yet — go to Firebase Console → Firestore Database → Create database.'
      )

      const preferredOrganizationId =
        nextImpersonation?.organizationId ||
        persistedOrganizationId ||
        activeMembership?.organization_id ||
        nextMemberships[0]?.organization_id ||
        null

      const selectedMembership =
        nextImpersonation && preferredOrganizationId
          ? {
              id: `impersonation-${preferredOrganizationId}`,
              organization_id: preferredOrganizationId,
              role: nextImpersonation.role || 'admin',
              organization:
                nextMemberships.find((membership) => membership.organization_id === preferredOrganizationId)?.organization ||
                (await tenantRepository.getOrganization(preferredOrganizationId)),
              impersonated: true,
            }
          : nextMemberships.find((membership) => membership.organization_id === preferredOrganizationId) ||
            nextMemberships[0] ||
            null

      const nextRoleDefinitions = selectedMembership?.organization_id
        ? await tenantRepository.listRoleDefinitions(selectedMembership.organization_id)
        : []

      setMemberships(nextMemberships)
      setActiveMembership(selectedMembership)
      setRoleDefinitions(normalizeRoleDefinitions(nextRoleDefinitions))
      setImpersonation(nextImpersonation)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load workspaces.')
    } finally {
      setLoading(false)
    }
  }, [activeMembership?.organization_id, user?.id])

  useEffect(() => {
    refreshAccess()
  }, [refreshAccess])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleAccessUpdate = () => {
      refreshAccess()
    }

    window.addEventListener('clucktrack:tenant-access-updated', handleAccessUpdate)
    return () => window.removeEventListener('clucktrack:tenant-access-updated', handleAccessUpdate)
  }, [refreshAccess])

  const createOrganization = useCallback(
    async (name) => {
      const result = await tenantRepository.createOrganization({ name })
      await refreshAccess()
      return result
    },
    [refreshAccess]
  )

  const switchOrganization = useCallback(
    async (organizationId) => {
      await tenantRepository.switchOrganization(organizationId)
      await refreshAccess()
    },
    [refreshAccess]
  )

  const startImpersonation = useCallback(
    async (organizationId, role = 'admin') => {
      await tenantRepository.startImpersonation(organizationId, role)
      await refreshAccess()
    },
    [refreshAccess]
  )

  const stopImpersonation = useCallback(async () => {
    await tenantRepository.stopImpersonation()
    await refreshAccess()
  }, [refreshAccess])

  const currentOrganization = activeMembership?.organization || null
  const currentRole =
    impersonation?.role || activeMembership?.role || (user?.platformRole === 'super_admin' ? 'super_admin' : user?.role) || null
  const currentRoleDefinition = resolveRoleDefinition(currentRole, roleDefinitions)
  const effectiveDashboardRole = currentRoleDefinition?.baseRole || currentRole

  const canAccessModule = useCallback(
    (moduleId) => {
      if (!moduleId) return false
      if (user?.platformRole === 'super_admin' && impersonation && currentOrganization) return true
      return canRoleAccessModule(currentRole, moduleId, roleDefinitions)
    },
    [currentOrganization, currentRole, impersonation, roleDefinitions, user?.platformRole]
  )

  const accessibleModules = useMemo(
    () =>
      user?.platformRole === 'super_admin' && impersonation && currentOrganization
        ? accessibleModulesForRole('admin', roleDefinitions, 1)
        : accessibleModulesForRole(currentRole, roleDefinitions, 1),
    [currentOrganization, currentRole, impersonation, roleDefinitions, user?.platformRole]
  )

  const value = useMemo(
    () => ({
      memberships,
      activeMembership,
      currentOrganization,
      currentRole,
      currentRoleDefinition,
      effectiveDashboardRole,
      roleDefinitions,
      accessibleModules,
      impersonation,
      loading,
      error,
      createOrganization,
      refreshAccess,
      switchOrganization,
      startImpersonation,
      stopImpersonation,
      canAccessModule,
      isPlatformOwner: user?.platformRole === 'super_admin',
      isImpersonating: Boolean(impersonation),
    }),
    [
      memberships,
      activeMembership,
      currentOrganization,
      currentRole,
      currentRoleDefinition,
      effectiveDashboardRole,
      roleDefinitions,
      accessibleModules,
      impersonation,
      loading,
      error,
      createOrganization,
      refreshAccess,
      switchOrganization,
      startImpersonation,
      stopImpersonation,
      canAccessModule,
      user?.platformRole,
    ]
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  return useContext(TenantContext)
}
