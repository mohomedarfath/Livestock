import { platformRepository } from './platformRepository'
import { ensureLegacySeed } from './legacyData'
import { isFirebaseConfigured } from '../../lib/env'

function activeTenantId() {
  ensureLegacySeed()
  return platformRepository.getActiveTenantId()
}

// User management in Firebase mode is handled via Firebase Auth + Firestore memberships.
// Direct user CRUD is only available in legacy-demo mode.
export const isLegacyUserManagementEnabled = !isFirebaseConfigured

export const userRepository = {
  async list() {
    if (!isLegacyUserManagementEnabled) return []
    const organizationId = activeTenantId()
    return organizationId ? platformRepository.listTenantUsers(organizationId) : []
  },

  async upsert(user, editingId) {
    if (!isLegacyUserManagementEnabled) {
      throw new Error('User management is handled through Firebase Auth in production.')
    }
    const organizationId = activeTenantId()
    if (!organizationId) return []
    return platformRepository.upsertTenantUser(organizationId, user, editingId)
  },

  async toggleActive(userId) {
    if (!isLegacyUserManagementEnabled) {
      throw new Error('User management is handled through Firebase Auth in production.')
    }
    const organizationId = activeTenantId()
    if (!organizationId) return []
    return platformRepository.toggleTenantUserActive(organizationId, userId)
  },
}
