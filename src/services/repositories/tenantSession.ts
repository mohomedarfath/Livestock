export type TenantImpersonation = {
  organizationId: string
  previousOrganizationId: string | null
  role: string
  startedAt: string
}

export type TenantSession = {
  activeOrganizationId: string | null
  impersonation: TenantImpersonation | null
}

const TENANT_SESSION_KEY = 'clucktrack_tenant_session_v1'

const EMPTY_SESSION: TenantSession = {
  activeOrganizationId: null,
  impersonation: null,
}

function resolveStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  return storage
}

export function readTenantSession(storage?: Storage | null): TenantSession {
  const target = resolveStorage(storage)
  if (!target) return { ...EMPTY_SESSION }

  try {
    const raw = target.getItem(TENANT_SESSION_KEY)
    if (!raw) return { ...EMPTY_SESSION }

    const parsed = JSON.parse(raw)
    return {
      activeOrganizationId: parsed?.activeOrganizationId || null,
      impersonation: parsed?.impersonation || null,
    }
  } catch {
    return { ...EMPTY_SESSION }
  }
}

export function writeTenantSession(session: TenantSession, storage?: Storage | null) {
  const target = resolveStorage(storage)
  if (!target) return session

  target.setItem(TENANT_SESSION_KEY, JSON.stringify(session))
  return session
}

export function clearTenantSession(storage?: Storage | null) {
  const target = resolveStorage(storage)
  if (!target) return

  target.removeItem(TENANT_SESSION_KEY)
}

export function updateTenantSession(
  updater: (session: TenantSession) => TenantSession,
  storage?: Storage | null
) {
  const nextSession = updater(readTenantSession(storage))
  writeTenantSession(nextSession, storage)
  return nextSession
}
