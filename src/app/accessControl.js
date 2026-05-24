import { APP_MODULES, MODULE_BY_ID } from './modules'

export const SYSTEM_ROLE_ORDER = ['admin', 'manager', 'employee', 'accountant']

export const SYSTEM_ROLE_META = {
  admin: {
    key: 'admin',
    name: 'Admin',
    description: 'Full farm administration access.',
    baseRole: 'admin',
    isSystem: true,
  },
  manager: {
    key: 'manager',
    name: 'Manager',
    description: 'Oversees operations, staff, and daily execution.',
    baseRole: 'manager',
    isSystem: true,
  },
  employee: {
    key: 'employee',
    name: 'Employee',
    description: 'Handles assigned farm work and routine updates.',
    baseRole: 'employee',
    isSystem: true,
  },
  accountant: {
    key: 'accountant',
    name: 'Accountant',
    description: 'Tracks sales, expenses, and financial reporting.',
    baseRole: 'accountant',
    isSystem: true,
  },
}

function defaultModulesForRole(roleKey) {
  return APP_MODULES.filter((module) => module.roles.includes(roleKey)).map((module) => module.id)
}

export function createDefaultRoleDefinitions() {
  return SYSTEM_ROLE_ORDER.map((roleKey) => ({
    ...SYSTEM_ROLE_META[roleKey],
    moduleIds: defaultModulesForRole(roleKey),
  }))
}

export function normalizeRoleDefinitions(roleDefinitions) {
  const defaults = createDefaultRoleDefinitions()
  const incoming = Array.isArray(roleDefinitions) ? roleDefinitions : []
  const byKey = Object.fromEntries(incoming.map((definition) => [definition.key, definition]))

  const normalizedDefaults = defaults.map((definition) => ({
    ...definition,
    ...(byKey[definition.key] || {}),
    moduleIds: Array.from(new Set(byKey[definition.key]?.moduleIds || definition.moduleIds)),
  }))

  const customRoles = incoming
    .filter((definition) => !SYSTEM_ROLE_META[definition.key])
    .map((definition) => ({
      key: definition.key,
      name: definition.name || definition.key,
      description: definition.description || '',
      baseRole: definition.baseRole || 'employee',
      isSystem: false,
      moduleIds: Array.from(new Set(definition.moduleIds || [])),
    }))

  return [...normalizedDefaults, ...customRoles]
}

export function roleDefinitionsToMap(roleDefinitions) {
  return Object.fromEntries(normalizeRoleDefinitions(roleDefinitions).map((definition) => [definition.key, definition]))
}

export function resolveRoleDefinition(roleKey, roleDefinitions) {
  if (!roleKey) return null
  const roleMap = roleDefinitionsToMap(roleDefinitions)
  return roleMap[roleKey] || null
}

export function canRoleAccessModule(roleKey, moduleId, roleDefinitions) {
  if (!roleKey || !moduleId) return false
  const roleDefinition = resolveRoleDefinition(roleKey, roleDefinitions)
  if (roleDefinition?.moduleIds?.includes(moduleId)) return true
  if (roleDefinition?.baseRole && MODULE_BY_ID[moduleId]?.roles?.includes(roleDefinition.baseRole)) return true
  const normalizedRoleKey = String(roleKey).replace(/[-_\s]/g, '').toLowerCase()
  const inferredSystemRole = SYSTEM_ROLE_ORDER.find((systemRole) => normalizedRoleKey.includes(systemRole))
  if (inferredSystemRole && MODULE_BY_ID[moduleId]?.roles?.includes(inferredSystemRole)) return true
  return Boolean(MODULE_BY_ID[moduleId]?.roles?.includes(roleKey))
}

export function accessibleModulesForRole(roleKey, roleDefinitions, phase = 1) {
  return APP_MODULES.filter(
    (module) => module.phase <= phase && canRoleAccessModule(roleKey, module.id, roleDefinitions)
  )
}

export function navigationModulesForRoleDefinitions(roleKey, roleDefinitions, phase = 1) {
  return accessibleModulesForRole(roleKey, roleDefinitions, phase).filter((module) => module.nav !== false)
}
