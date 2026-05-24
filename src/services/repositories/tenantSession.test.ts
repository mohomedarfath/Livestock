import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearTenantSession,
  readTenantSession,
  updateTenantSession,
} from './tenantSession'

describe('tenantSession', () => {
  beforeEach(() => {
    clearTenantSession()
  })

  it('persists the selected organization between reads', () => {
    updateTenantSession((session) => ({
      ...session,
      activeOrganizationId: 'legacy-farm',
      impersonation: null,
    }))

    expect(readTenantSession()).toEqual({
      activeOrganizationId: 'legacy-farm',
      impersonation: null,
    })
  })

  it('stores impersonation metadata alongside the previous organization', () => {
    updateTenantSession(() => ({
      activeOrganizationId: 'sunrise-hatcheries',
      impersonation: {
        organizationId: 'sunrise-hatcheries',
        previousOrganizationId: 'legacy-farm',
        role: 'admin',
        startedAt: '2026-04-27T10:00:00.000Z',
      },
    }))

    expect(readTenantSession().impersonation).toEqual({
      organizationId: 'sunrise-hatcheries',
      previousOrganizationId: 'legacy-farm',
      role: 'admin',
      startedAt: '2026-04-27T10:00:00.000Z',
    })
  })
})
