import { Storage } from '../../utils/storage'
import { createDefaultRoleDefinitions, normalizeRoleDefinitions } from '../../app/accessControl'

const PLATFORM_STATE_KEY = 'clucktrack_platform_state_v1'
const AUTH_SESSION_KEY = 'clucktrack_platform_session_v1'
const ACCESS_EVENT = 'clucktrack:tenant-access-updated'

const WORKSPACE_KEYS = [
  'farm_pro_users',
  'farm_pro_employees',
  'farm_pro_activities',
  'farm_pro_expenses',
  'farm_pro_budgets',
  'farm_pro_settings',
  'farm_pro_wages',
  'clucktrack_flocks',
  'clucktrack_logs',
  'clucktrack_feedlog',
  'clucktrack_feed_stock',
  'clucktrack_sales',
  'clucktrack_medicinelog',
  'clucktrack_med_stock',
  'clucktrack_vaccinations',
  'clucktrack_eggs',
  'clucktrack_inventory',
  'clucktrack_incubations',
  'clucktrack_vet_notes',
  'clucktrack_pastures',
  'clucktrack_pasture_logs',
  'clucktrack_resources',
  'clucktrack_fcr',
  'clucktrack_whatsapp_phone',
]

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function readJson(key) {
  const value = localStorage.getItem(key)
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function emitAccessChanged() {
  window.dispatchEvent(new CustomEvent(ACCESS_EVENT))
}

function readWorkspaceSnapshot() {
  return Object.fromEntries(
    WORKSPACE_KEYS.map((key) => [key, readJson(key)]).filter(([, value]) => value !== null)
  )
}

function hydrateWorkspaceSnapshot(snapshot) {
  WORKSPACE_KEYS.forEach((key) => {
    if (snapshot?.[key] === undefined) {
      localStorage.removeItem(key)
      return
    }

    writeJson(key, snapshot[key])
  })
}

function getSessionData() {
  return readJson(AUTH_SESSION_KEY)
}

function setSessionData(session) {
  if (!session) {
    localStorage.removeItem(AUTH_SESSION_KEY)
    return
  }

  writeJson(AUTH_SESSION_KEY, session)
}

function getState() {
  return readJson(PLATFORM_STATE_KEY)
}

function setState(state) {
  writeJson(PLATFORM_STATE_KEY, state)
}

function buildTenantUsers(state, organizationId) {
  return state.memberships
    .filter((membership) => membership.organization_id === organizationId)
    .map((membership) => {
      const user = state.users.find((entry) => entry.id === membership.user_id)
      if (!user) return null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password || '',
        role: membership.role,
        active: membership.active !== false && user.active !== false,
        createdAt: user.createdAt,
      }
    })
    .filter(Boolean)
}

function syncTenantUsersIntoSnapshot(state, organizationId) {
  const snapshot = state.snapshots[organizationId] || {}
  state.snapshots[organizationId] = {
    ...snapshot,
    farm_pro_users: buildTenantUsers(state, organizationId),
  }
}

function createTenantSnapshot(baseSnapshot, { farmName, address, phone, subscription }) {
  const snapshot = clone(baseSnapshot)

  snapshot.farm_pro_settings = {
    ...(snapshot.farm_pro_settings || {}),
    farmName,
    address,
  }

  snapshot.clucktrack_whatsapp_phone = phone || ''
  snapshot.clucktrack_feed_stock = {
    ...(snapshot.clucktrack_feed_stock || { kgOnHand: 0, threshold: 50 }),
    kgOnHand: Math.max(0, Number(snapshot.clucktrack_feed_stock?.kgOnHand || 0) + Math.floor(Math.random() * 120)),
  }

  snapshot.clucktrack_inventory = {
    ...(snapshot.clucktrack_inventory || { version: 1, items: [], movements: [] }),
    movements: snapshot.clucktrack_inventory?.movements || [],
  }

  snapshot.clucktrack_resources = (snapshot.clucktrack_resources || []).map((entry, index) => ({
    ...entry,
    electricity: Math.max(1, Number(entry.electricity || 0) + index % 2),
    water: Math.max(50, Number(entry.water || 0) + index * 3),
  }))

  snapshot.clucktrack_sales = (snapshot.clucktrack_sales || []).map((entry) => ({
    ...entry,
    buyerName: entry.buyerName || `${farmName} Buyer`,
  }))

  snapshot.subscription = subscription
  return snapshot
}

function defaultOrganizations() {
  return [
    {
      id: 'legacy-farm',
      name: 'Legacy Demo Farm',
      slug: 'legacy-demo-farm',
      plan: 'growth',
      billing_status: 'active',
      active: true,
      createdAt: '2026-03-01',
      supportTier: 'Priority',
    },
    {
      id: 'sunrise-hatcheries',
      name: 'Sunrise Hatcheries',
      slug: 'sunrise-hatcheries',
      plan: 'starter',
      billing_status: 'trialing',
      active: true,
      createdAt: '2026-03-14',
      supportTier: 'Standard',
    },
    {
      id: 'hilltop-layers',
      name: 'Hilltop Layers Co.',
      slug: 'hilltop-layers',
      plan: 'enterprise',
      billing_status: 'past_due',
      active: true,
      createdAt: '2026-02-10',
      supportTier: 'Dedicated',
    },
  ]
}

function defaultUsers() {
  return [
    {
      id: 'platform-owner',
      name: 'Platform Owner',
      email: 'owner@clucktrack.com',
      password: 'owner123',
      role: 'super_admin',
      platformRole: 'super_admin',
      active: true,
      createdAt: '2026-01-01',
    },
    {
      id: 'u1',
      name: 'Admin User',
      email: 'admin@farm.com',
      password: 'admin123',
      role: 'admin',
      active: true,
      createdAt: '2026-03-01',
    },
    {
      id: 'u2',
      name: 'Farm Manager',
      email: 'manager@farm.com',
      password: 'manager123',
      role: 'manager',
      active: true,
      createdAt: '2026-03-01',
    },
    {
      id: 'u3',
      name: 'John Worker',
      email: 'emp@farm.com',
      password: 'emp123',
      role: 'employee',
      active: true,
      createdAt: '2026-03-01',
    },
    {
      id: 'u4',
      name: 'Accountant User',
      email: 'acc@farm.com',
      password: 'acc123',
      role: 'accountant',
      active: true,
      createdAt: '2026-03-01',
    },
    {
      id: 'u5',
      name: 'Sunrise Admin',
      email: 'owner@sunrisefarm.com',
      password: 'sunrise123',
      role: 'admin',
      active: true,
      createdAt: '2026-03-14',
    },
    {
      id: 'u6',
      name: 'Layer Ops Lead',
      email: 'ops@hilltoplayers.com',
      password: 'hilltop123',
      role: 'manager',
      active: true,
      createdAt: '2026-02-10',
    },
  ]
}

function defaultMemberships() {
  return [
    {
      id: 'm1',
      user_id: 'u1',
      organization_id: 'legacy-farm',
      role: 'admin',
      active: true,
      createdAt: '2026-03-01',
    },
    {
      id: 'm2',
      user_id: 'u2',
      organization_id: 'legacy-farm',
      role: 'manager',
      active: true,
      createdAt: '2026-03-01',
    },
    {
      id: 'm3',
      user_id: 'u3',
      organization_id: 'legacy-farm',
      role: 'employee',
      active: true,
      createdAt: '2026-03-01',
    },
    {
      id: 'm4',
      user_id: 'u4',
      organization_id: 'legacy-farm',
      role: 'accountant',
      active: true,
      createdAt: '2026-03-01',
    },
    {
      id: 'm5',
      user_id: 'u5',
      organization_id: 'sunrise-hatcheries',
      role: 'admin',
      active: true,
      createdAt: '2026-03-14',
    },
    {
      id: 'm6',
      user_id: 'u6',
      organization_id: 'hilltop-layers',
      role: 'manager',
      active: true,
      createdAt: '2026-02-10',
    },
  ]
}

function defaultRoleDefinitions() {
  const defaults = createDefaultRoleDefinitions()

  return {
    'legacy-farm': defaults,
    'sunrise-hatcheries': [
      ...defaults,
      {
        key: 'supervisor',
        name: 'Supervisor',
        description: 'Coordinates staff and records operational data.',
        baseRole: 'manager',
        isSystem: false,
        moduleIds: Array.from(
          new Set(
            defaults.find((definition) => definition.key === 'manager')?.moduleIds?.filter(
              (moduleId) => moduleId !== 'users'
            ) || []
          )
        ),
      },
    ],
    'hilltop-layers': defaults,
  }
}

function buildInitialState() {
  Storage.seed()
  const baseSnapshot = readWorkspaceSnapshot()
  const organizations = defaultOrganizations()
  const users = defaultUsers()
  const memberships = defaultMemberships()
  const snapshots = {
    'legacy-farm': createTenantSnapshot(baseSnapshot, {
      farmName: 'Legacy Demo Farm',
      address: '123 Farm Road, Agriculture District',
      phone: '+94 71 555 1001',
      subscription: 'growth',
    }),
    'sunrise-hatcheries': createTenantSnapshot(baseSnapshot, {
      farmName: 'Sunrise Hatcheries',
      address: '89 Lakeview Road, Kurunegala',
      phone: '+94 71 555 1002',
      subscription: 'starter',
    }),
    'hilltop-layers': createTenantSnapshot(baseSnapshot, {
      farmName: 'Hilltop Layers Co.',
      address: '42 Ridge Estate, Kandy',
      phone: '+94 71 555 1003',
      subscription: 'enterprise',
    }),
  }

  const state = {
    organizations,
    users,
    memberships,
    roleDefinitions: defaultRoleDefinitions(),
    snapshots,
    activeTenantId: 'legacy-farm',
    impersonation: null,
  }

  organizations.forEach((organization) => syncTenantUsersIntoSnapshot(state, organization.id))
  return state
}

function ensureState() {
  const existing = getState()
  if (existing) return existing

  const initialState = buildInitialState()
  setState(initialState)
  setSessionData(getSessionData() || { userId: null, activeTenantId: initialState.activeTenantId, impersonation: null })
  hydrateWorkspaceSnapshot(initialState.snapshots[initialState.activeTenantId])
  return initialState
}

function withState(mutator) {
  const state = ensureState()
  const nextState = mutator(clone(state)) || state
  setState(nextState)
  return nextState
}

function getOrganization(state, organizationId) {
  return state.organizations.find((organization) => organization.id === organizationId) || null
}

function getMembershipsForUser(state, userId) {
  return state.memberships
    .filter((membership) => membership.user_id === userId && membership.active !== false)
    .map((membership) => ({
      ...membership,
      organization: getOrganization(state, membership.organization_id),
    }))
    .filter((membership) => membership.organization)
}

function persistActiveTenantSnapshot(state) {
  if (!state.activeTenantId) return state
  state.snapshots[state.activeTenantId] = readWorkspaceSnapshot()
  syncTenantUsersIntoSnapshot(state, state.activeTenantId)
  return state
}

function activateTenantInternal(state, organizationId) {
  if (!organizationId) {
    state.activeTenantId = null
    return state
  }

  persistActiveTenantSnapshot(state)
  state.activeTenantId = organizationId
  syncTenantUsersIntoSnapshot(state, organizationId)
  hydrateWorkspaceSnapshot(state.snapshots[organizationId] || {})
  return state
}

function sessionUserFromState(state) {
  const session = getSessionData()
  if (!session?.userId) return null
  const user = state.users.find((entry) => entry.id === session.userId)
  if (!user) return null

  return {
    ...user,
    role: user.platformRole === 'super_admin' ? 'super_admin' : user.role,
    activeTenantId: session.activeTenantId || state.activeTenantId || null,
    impersonation: session.impersonation || null,
  }
}

export const platformRepository = {
  accessEventName: ACCESS_EVENT,

  ensureDemoPlatform() {
    return ensureState()
  },

  getSessionUser() {
    const state = ensureState()
    return sessionUserFromState(state)
  },

  async authenticateLegacyUser(email, password) {
    const state = ensureState()
    const user = state.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase())

    if (!user || user.password !== password) {
      return { success: false, error: 'Invalid email or password.' }
    }

    if (!user.active) {
      return { success: false, error: 'Your account has been deactivated.' }
    }

    const memberships = getMembershipsForUser(state, user.id)

    if (user.platformRole !== 'super_admin' && memberships.length === 0) {
      return { success: false, error: 'You do not have access to any farm workspace.' }
    }

    const activeTenantId =
      memberships[0]?.organization_id ||
      state.activeTenantId ||
      null

    const nextSession = {
      userId: user.id,
      activeTenantId,
      impersonation: null,
    }

    setSessionData(nextSession)

    const nextState = withState((draft) => {
      draft.impersonation = null
      if (activeTenantId) {
        activateTenantInternal(draft, activeTenantId)
      }
      return draft
    })

    emitAccessChanged()
    return { success: true, user: sessionUserFromState(nextState) }
  },

  async logoutLegacyUser() {
    withState((draft) => {
      persistActiveTenantSnapshot(draft)
      draft.impersonation = null
      return draft
    })
    setSessionData(null)
    emitAccessChanged()
  },

  getActiveTenantId() {
    const state = ensureState()
    return state.impersonation?.organizationId || state.activeTenantId || getSessionData()?.activeTenantId || null
  },

  async listOrganizations() {
    const state = ensureState()
    return state.organizations
  },

  async getOrganization(organizationId) {
    const state = ensureState()
    return getOrganization(state, organizationId)
  },

  async listMemberships(userId) {
    const state = ensureState()
    return getMembershipsForUser(state, userId)
  },

  async listRoleDefinitions(organizationId) {
    const state = ensureState()
    return normalizeRoleDefinitions(state.roleDefinitions[organizationId])
  },

  async switchTenant(organizationId) {
    const nextState = withState((draft) => {
      draft.impersonation = null
      activateTenantInternal(draft, organizationId)
      return draft
    })

    const session = getSessionData()
    setSessionData({
      ...session,
      activeTenantId: organizationId,
      impersonation: null,
    })

    emitAccessChanged()
    return getOrganization(nextState, organizationId)
  },

  async startImpersonation(organizationId, role = 'admin') {
    const nextState = withState((draft) => {
      draft.impersonation = {
        organizationId,
        role,
        startedAt: new Date().toISOString(),
        previousOrganizationId: draft.activeTenantId,
      }
      activateTenantInternal(draft, organizationId)
      return draft
    })

    const session = getSessionData()
    setSessionData({
      ...session,
      activeTenantId: organizationId,
      impersonation: nextState.impersonation,
    })

    emitAccessChanged()
    return nextState.impersonation
  },

  async stopImpersonation() {
    const nextState = withState((draft) => {
      const previousOrganizationId = draft.impersonation?.previousOrganizationId || null
      draft.impersonation = null
      if (previousOrganizationId) {
        activateTenantInternal(draft, previousOrganizationId)
      } else {
        persistActiveTenantSnapshot(draft)
        draft.activeTenantId = null
      }
      return draft
    })

    const session = getSessionData()
    setSessionData({
      ...session,
      activeTenantId: nextState.activeTenantId || null,
      impersonation: null,
    })

    emitAccessChanged()
  },

  async getImpersonation() {
    const state = ensureState()
    return state.impersonation
  },

  async createOrganization({
    name,
    ownerName,
    ownerEmail,
    ownerPassword,
    plan = 'starter',
    billing_status = 'trialing',
  }) {
    const nextState = withState((draft) => {
      const slugBase = slugify(name)
      const slug = draft.organizations.some((organization) => organization.slug === slugBase)
        ? `${slugBase}-${draft.organizations.length + 1}`
        : slugBase
      const organizationId = slug
      const organization = {
        id: organizationId,
        name,
        slug,
        plan,
        billing_status,
        active: true,
        createdAt: new Date().toISOString().split('T')[0],
        supportTier: plan === 'enterprise' ? 'Dedicated' : 'Standard',
      }

      draft.organizations.push(organization)
      draft.roleDefinitions[organizationId] = createDefaultRoleDefinitions()

      const templateSnapshot = draft.snapshots['legacy-farm'] || readWorkspaceSnapshot()
      draft.snapshots[organizationId] = createTenantSnapshot(templateSnapshot, {
        farmName: name,
        address: '',
        phone: '',
        subscription: plan,
      })

      let ownerUser = draft.users.find((entry) => entry.email.toLowerCase() === ownerEmail.toLowerCase())

      if (!ownerUser) {
        ownerUser = {
          id: createId('user'),
          name: ownerName,
          email: ownerEmail,
          password: ownerPassword,
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString().split('T')[0],
        }
        draft.users.push(ownerUser)
      } else {
        ownerUser.name = ownerName
        ownerUser.password = ownerPassword || ownerUser.password
        ownerUser.role = 'admin'
        ownerUser.active = true
      }

      draft.memberships.push({
        id: createId('membership'),
        user_id: ownerUser.id,
        organization_id: organizationId,
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString().split('T')[0],
      })

      syncTenantUsersIntoSnapshot(draft, organizationId)
      return draft
    })

    emitAccessChanged()
    return nextState.organizations[nextState.organizations.length - 1]
  },

  async updateSubscription(organizationId, updates) {
    const nextState = withState((draft) => {
      draft.organizations = draft.organizations.map((organization) =>
        organization.id === organizationId ? { ...organization, ...updates } : organization
      )
      return draft
    })

    emitAccessChanged()
    return getOrganization(nextState, organizationId)
  },

  async updateOrganization(organizationId, updates) {
    const nextState = withState((draft) => {
      draft.organizations = draft.organizations.map((organization) =>
        organization.id === organizationId
          ? {
              ...organization,
              ...(updates.name ? { name: updates.name.trim() } : {}),
              ...(updates.slug ? { slug: slugify(updates.slug) } : {}),
            }
          : organization
      )
      return draft
    })

    emitAccessChanged()
    return getOrganization(nextState, organizationId)
  },

  async listTenantUsers(organizationId) {
    const state = ensureState()
    return buildTenantUsers(state, organizationId)
  },

  async upsertTenantUser(organizationId, payload, editingId) {
    const nextState = withState((draft) => {
      const email = payload.email.trim().toLowerCase()
      let targetUser = draft.users.find((entry) => entry.id === editingId)

      if (!targetUser) {
        targetUser = draft.users.find((entry) => entry.email.toLowerCase() === email) || null
      }

      if (targetUser) {
        targetUser.name = payload.name.trim()
        targetUser.email = payload.email.trim()
        targetUser.role = payload.role
        targetUser.active = payload.active ?? targetUser.active ?? true
        if (payload.password) targetUser.password = payload.password
      } else {
        targetUser = {
          id: createId('user'),
          name: payload.name.trim(),
          email: payload.email.trim(),
          password: payload.password || 'welcome123',
          role: payload.role,
          active: true,
          createdAt: new Date().toISOString().split('T')[0],
        }
        draft.users.push(targetUser)
      }

      const existingMembership = draft.memberships.find(
        (membership) => membership.organization_id === organizationId && membership.user_id === targetUser.id
      )

      if (existingMembership) {
        existingMembership.role = payload.role
        existingMembership.active = payload.active ?? existingMembership.active ?? true
      } else {
        draft.memberships.push({
          id: createId('membership'),
          user_id: targetUser.id,
          organization_id: organizationId,
          role: payload.role,
          active: true,
          createdAt: new Date().toISOString().split('T')[0],
        })
      }

      syncTenantUsersIntoSnapshot(draft, organizationId)

      if (draft.activeTenantId === organizationId) {
        hydrateWorkspaceSnapshot({
          ...(draft.snapshots[organizationId] || {}),
          farm_pro_users: buildTenantUsers(draft, organizationId),
        })
      }

      return draft
    })

    emitAccessChanged()
    return buildTenantUsers(nextState, organizationId)
  },

  async toggleTenantUserActive(organizationId, userId) {
    const nextState = withState((draft) => {
      draft.memberships = draft.memberships.map((membership) =>
        membership.organization_id === organizationId && membership.user_id === userId
          ? { ...membership, active: membership.active === false ? true : false }
          : membership
      )

      syncTenantUsersIntoSnapshot(draft, organizationId)

      if (draft.activeTenantId === organizationId) {
        hydrateWorkspaceSnapshot({
          ...(draft.snapshots[organizationId] || {}),
          farm_pro_users: buildTenantUsers(draft, organizationId),
        })
      }

      return draft
    })

    emitAccessChanged()
    return buildTenantUsers(nextState, organizationId)
  },

  async upsertRoleDefinition(organizationId, payload) {
    const nextState = withState((draft) => {
      const existing = normalizeRoleDefinitions(draft.roleDefinitions[organizationId])
      const nextDefinition = {
        key: payload.key,
        name: payload.name,
        description: payload.description || '',
        baseRole: payload.baseRole || 'employee',
        isSystem: payload.isSystem === true,
        moduleIds: Array.from(new Set(payload.moduleIds || [])),
      }

      draft.roleDefinitions[organizationId] = normalizeRoleDefinitions([
        ...existing.filter((definition) => definition.key !== payload.key),
        nextDefinition,
      ])

      return draft
    })

    emitAccessChanged()
    return normalizeRoleDefinitions(nextState.roleDefinitions[organizationId])
  },

  async deleteRoleDefinition(organizationId, roleKey) {
    const nextState = withState((draft) => {
      draft.roleDefinitions[organizationId] = normalizeRoleDefinitions(
        (draft.roleDefinitions[organizationId] || []).filter(
          (definition) => definition.key !== roleKey || definition.isSystem
        )
      )

      draft.memberships = draft.memberships.map((membership) =>
        membership.organization_id === organizationId && membership.role === roleKey
          ? { ...membership, role: 'employee' }
          : membership
      )

      syncTenantUsersIntoSnapshot(draft, organizationId)
      return draft
    })

    emitAccessChanged()
    return normalizeRoleDefinitions(nextState.roleDefinitions[organizationId])
  },

  async getPlatformOverview() {
    const state = ensureState()
    return state.organizations.map((organization) => {
      const snapshot = state.snapshots[organization.id] || {}
      const users = buildTenantUsers(state, organization.id)
      const flocks = snapshot.clucktrack_flocks || []
      const sales = snapshot.clucktrack_sales || []
      const logs = snapshot.clucktrack_logs || []

      return {
        ...organization,
        userCount: users.filter((user) => user.active).length,
        flockCount: flocks.length,
        logCount: logs.length,
        monthlyRevenue: sales.reduce((sum, sale) => sum + (Number(sale.totalPrice) || 0), 0),
      }
    })
  },
}
