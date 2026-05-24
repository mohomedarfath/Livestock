import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { platformRepository } from './platformRepository'
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function supportTierForPlan(plan: string) {
  if (plan === 'enterprise') return 'Dedicated'
  if (plan === 'growth') return 'Priority'
  return 'Standard'
}

async function findUserByEmail(email: string) {
  if (!db || !email.trim()) return null

  const normalizedEmail = email.trim().toLowerCase()
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('email', '==', normalizedEmail), limit(1))
  )

  if (snapshot.empty) return null

  const userDoc = snapshot.docs[0]
  return { id: userDoc.id, ...userDoc.data() }
}

async function listOrganizationCounts(organizationId: string) {
  if (!db) {
    return {
      flockCount: 0,
      logCount: 0,
      monthlyRevenue: 0,
      userCount: 0,
    }
  }

  const [memberships, flocks, logs, sales] = await Promise.all([
    getDocs(query(collection(db, 'memberships'), where('organizationId', '==', organizationId))),
    getDocs(collection(db, 'organizations', organizationId, 'flocks')),
    getDocs(collection(db, 'organizations', organizationId, 'dailyLogs')),
    getDocs(collection(db, 'organizations', organizationId, 'sales')),
  ])

  return {
    userCount: memberships.docs.filter((entry) => entry.data().active !== false).length,
    flockCount: flocks.size,
    logCount: logs.size,
    monthlyRevenue: sales.docs.reduce(
      (sum, entry) => sum + (Number(entry.data().totalPrice || 0) || 0),
      0
    ),
  }
}

export const platformAdminRepository = {
  async getPlatformOverview() {
    if (isFirebaseConfigured && db) {
      const organizationsSnapshot = await getDocs(collection(db, 'organizations'))
      const organizations = organizationsSnapshot.docs.map((entry) => ({
        id: entry.id,
        ...entry.data(),
      }))

      const overview = await Promise.all(
        organizations.map(async (organization: any) => ({
          ...organization,
          ...(await listOrganizationCounts(organization.id)),
        }))
      )

      return overview.sort((left, right) => String(left.name).localeCompare(String(right.name)))
    }

    return platformRepository.getPlatformOverview()
  },

  async createOrganization({
    name,
    ownerName,
    ownerEmail,
    ownerPassword,
    plan = 'starter',
    billing_status = 'trialing',
  }: {
    name: string
    ownerName: string
    ownerEmail: string
    ownerPassword?: string
    plan?: string
    billing_status?: string
  }) {
    if (isFirebaseConfigured && db) {
      const createdAt = new Date().toISOString()
      const slug = toSlug(name)
      const normalizedOwnerEmail = ownerEmail.trim().toLowerCase()
      const ownerProfile = normalizedOwnerEmail ? await findUserByEmail(normalizedOwnerEmail) : null

      const orgRef = doc(collection(db, 'organizations'))
      trackFirestoreWrite(setDoc(orgRef, {
        name: name.trim(),
        slug,
        plan,
        billing_status,
        active: true,
        supportTier: supportTierForPlan(plan),
        ownerName: ownerName.trim(),
        ownerEmail: normalizedOwnerEmail,
        ownerStatus: ownerProfile ? 'linked' : 'pending',
        ownerUserId: ownerProfile?.id || null,
        clientCreatedAt: createdAt,
        ...writeTimestamps(true),
      }))

      trackFirestoreWrite(setDoc(
        doc(db, 'organizations', orgRef.id, 'settings', 'config'),
        {
          farmName: name.trim(),
          address: '',
          currency: 'LKR',
          logo: null,
          ...writeTimestamps(),
        },
        { merge: true }
      ))

      if (ownerProfile?.id) {
        trackFirestoreWrite(setDoc(
          doc(db, 'memberships', `${orgRef.id}_${ownerProfile.id}`),
          {
            userId: ownerProfile.id,
            organizationId: orgRef.id,
            role: 'admin',
            active: true,
            clientCreatedAt: createdAt,
            ...writeTimestamps(true),
          },
          { merge: true }
        ))
      }

      return {
        id: orgRef.id,
        name: name.trim(),
        slug,
        ownerAssignment: ownerProfile ? 'linked' : 'pending',
      }
    }

    const organization = await platformRepository.createOrganization({
      name,
      ownerName,
      ownerEmail,
      ownerPassword,
      plan,
      billing_status,
    })
    return {
      ...organization,
      ownerAssignment: 'linked',
    }
  },

  async updateSubscription(organizationId: string, updates: Record<string, unknown>) {
    if (isFirebaseConfigured && db) {
      trackFirestoreWrite(updateDoc(doc(db, 'organizations', organizationId), {
        ...updates,
        ...writeTimestamps(),
      }))
      return
    }

    await platformRepository.updateSubscription(organizationId, updates)
  },
}
