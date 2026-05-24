import { db, auth } from '../../lib/firebase'
import { env, isFirebaseConfigured } from '../../lib/env'
import { createDefaultRoleDefinitions } from '../../app/accessControl'
import { platformRepository } from './platformRepository'
import { readTenantSession, updateTenantSession } from './tenantSession'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore'
import { trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const tenantRepository = {
  async listMemberships(userId: string) {
    if (!userId) return []

    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'memberships'), where('userId', '==', userId))
      const snapshot = await getDocs(q)
      const memberships = snapshot.docs.map((d) => ({ id: d.id, ...d.data() as any }))

      const result: any[] = []
      for (const membership of memberships) {
        const orgSnap = await getDoc(doc(db, 'organizations', membership.organizationId))
        result.push({
          id: membership.id,
          organization_id: membership.organizationId,
          role: membership.role,
          organization: orgSnap.exists() ? { id: orgSnap.id, ...orgSnap.data() } : null,
        })
      }
      return result
    }

    if (env.enableLegacyDemo) {
      platformRepository.ensureDemoPlatform()
      return platformRepository.listMemberships(userId)
    }

    return []
  },

  async createOrganization({ name, role = 'admin' }: { name: string; role?: string }) {
    if (isFirebaseConfigured && db) {
      const slug = toSlug(name)
      const createdAt = new Date().toISOString()
      const orgRef = doc(collection(db, 'organizations'))
      trackFirestoreWrite(setDoc(orgRef, {
        name,
        slug,
        plan: 'starter',
        billing_status: 'active',
        clientCreatedAt: createdAt,
        ...writeTimestamps(true),
      }))

      const userId = auth?.currentUser?.uid
      if (userId) {
        trackFirestoreWrite(setDoc(doc(db, 'memberships', `${orgRef.id}_${userId}`), {
          userId,
          organizationId: orgRef.id,
          role,
          active: true,
          clientCreatedAt: createdAt,
          ...writeTimestamps(true),
        }, { merge: true }))
      }

      updateTenantSession((session) => ({
        ...session,
        activeOrganizationId: orgRef.id,
        impersonation: null,
      }))

      return { id: orgRef.id, name, slug }
    }

    if (env.enableLegacyDemo) {
      const sessionUser = platformRepository.getSessionUser()
      const ownerName = sessionUser?.name || 'Farm Admin'
      const ownerEmail = sessionUser?.email || `${toSlug(name)}@farm.com`
      const ownerPassword = 'welcome123'

      return platformRepository.createOrganization({
        name,
        ownerName,
        ownerEmail,
        ownerPassword,
        plan: role === 'admin' ? 'starter' : 'growth',
      })
    }

    throw new Error('Organization creation requires Firebase configuration.')
  },

  async getOrganization(organizationId: string) {
    if (!organizationId) return null

    if (isFirebaseConfigured && db) {
      const orgSnap = await getDoc(doc(db, 'organizations', organizationId))
      if (!orgSnap.exists()) return null
      return { id: orgSnap.id, ...orgSnap.data() }
    }

    if (env.enableLegacyDemo) {
      return platformRepository.getOrganization(organizationId)
    }

    return null
  },

  async updateOrganization(organizationId: string, { name, slug }: { name: string; slug?: string }) {
    if (!organizationId || !name?.trim()) return null

    if (isFirebaseConfigured && db) {
      const orgRef = doc(db, 'organizations', organizationId)
      trackFirestoreWrite(updateDoc(orgRef, {
        name: name.trim(),
        slug: (slug || toSlug(name)).trim(),
        ...writeTimestamps(),
      }))
      return this.getOrganization(organizationId)
    }

    if (env.enableLegacyDemo) {
      return platformRepository.updateOrganization(organizationId, { name, slug: slug || toSlug(name) })
    }

    return null
  },

  async listRoleDefinitions(organizationId: string) {
    if (!organizationId) return createDefaultRoleDefinitions()

    if (env.enableLegacyDemo) {
      return platformRepository.listRoleDefinitions(organizationId)
    }

    return createDefaultRoleDefinitions()
  },

  async switchOrganization(organizationId: string) {
    if (!organizationId) return null

    if (isFirebaseConfigured) {
      updateTenantSession((session) => ({
        ...session,
        activeOrganizationId: organizationId,
        impersonation: null,
      }))
      return this.getOrganization(organizationId)
    }

    if (env.enableLegacyDemo) {
      return platformRepository.switchTenant(organizationId)
    }

    return this.getOrganization(organizationId)
  },

  async getImpersonation() {
    if (isFirebaseConfigured) return readTenantSession().impersonation

    if (env.enableLegacyDemo) {
      return platformRepository.getImpersonation()
    }

    return null
  },

  async startImpersonation(organizationId: string, role = 'admin') {
    if (isFirebaseConfigured) {
      const startedAt = new Date().toISOString()
      const nextSession = updateTenantSession((session) => ({
        activeOrganizationId: organizationId,
        impersonation: {
          organizationId,
          role,
          startedAt,
          previousOrganizationId: session.activeOrganizationId || null,
        },
      }))
      return nextSession.impersonation
    }

    if (env.enableLegacyDemo) {
      return platformRepository.startImpersonation(organizationId, role)
    }
    return null
  },

  async stopImpersonation() {
    if (isFirebaseConfigured) {
      updateTenantSession((session) => ({
        activeOrganizationId: session.impersonation?.previousOrganizationId || null,
        impersonation: null,
      }))
      return
    }

    if (env.enableLegacyDemo) {
      await platformRepository.stopImpersonation()
    }
  },

  async getActiveOrganizationId() {
    if (isFirebaseConfigured) {
      return readTenantSession().activeOrganizationId
    }

    if (env.enableLegacyDemo) {
      return platformRepository.getActiveTenantId()
    }

    return null
  },
}
