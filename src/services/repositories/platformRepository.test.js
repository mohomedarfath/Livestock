import { beforeEach, describe, expect, it } from 'vitest'
import { platformRepository } from './platformRepository'

describe('platformRepository', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keeps custom role definitions scoped to the target tenant', async () => {
    platformRepository.ensureDemoPlatform()

    await platformRepository.upsertRoleDefinition('legacy-farm', {
      key: 'auditor',
      name: 'Auditor',
      description: 'Read-only reviewer',
      baseRole: 'accountant',
      isSystem: false,
      moduleIds: ['dashboard', 'profit'],
    })

    const legacyRoles = await platformRepository.listRoleDefinitions('legacy-farm')
    const sunriseRoles = await platformRepository.listRoleDefinitions('sunrise-hatcheries')

    expect(legacyRoles.some((role) => role.key === 'auditor')).toBe(true)
    expect(sunriseRoles.some((role) => role.key === 'auditor')).toBe(false)
    expect(sunriseRoles.some((role) => role.key === 'supervisor')).toBe(true)
  })
})
