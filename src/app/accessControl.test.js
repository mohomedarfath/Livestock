import { describe, expect, it } from 'vitest'
import {
  accessibleModulesForRole,
  canRoleAccessModule,
  createDefaultRoleDefinitions,
  workspacesForRole,
} from './accessControl'

const ROLE_EXPECTATIONS = {
  admin: {
    workspaces: ['farm', 'shop'],
    allowed: ['dashboard', 'flocks', 'inventory', 'expenses', 'users', 'settings', 'shop-dashboard', 'shop-products', 'shop-orders', 'shop-customers'],
    denied: [],
  },
  manager: {
    workspaces: ['farm', 'shop'],
    allowed: ['dashboard', 'flocks', 'inventory', 'activities', 'employees-roster', 'shop-dashboard', 'shop-products', 'shop-orders', 'shop-customers'],
    denied: ['users', 'settings', 'expenses', 'budgets', 'wages'],
  },
  employee: {
    workspaces: ['farm'],
    allowed: ['dashboard', 'flocks', 'daily-log', 'my-activities', 'inventory'],
    denied: ['users', 'settings', 'employees-roster', 'expenses', 'shop-dashboard', 'shop-orders', 'shop-products'],
  },
  accountant: {
    workspaces: ['farm', 'shop'],
    allowed: ['dashboard', 'cow-dashboard', 'inventory', 'feed', 'medicine', 'expenses', 'budgets', 'wages', 'sales', 'profit', 'shop-dashboard'],
    denied: ['users', 'settings', 'flocks', 'daily-log', 'shop-products', 'shop-orders', 'shop-customers'],
  },
  shop_manager: {
    workspaces: ['shop'],
    allowed: ['dashboard', 'shop-dashboard', 'shop-products', 'shop-orders', 'shop-customers'],
    denied: ['flocks', 'daily-log', 'inventory', 'expenses', 'users', 'settings'],
  },
  cashier: {
    workspaces: ['shop'],
    allowed: ['dashboard', 'shop-dashboard', 'shop-orders', 'shop-customers'],
    denied: ['flocks', 'inventory', 'expenses', 'shop-products', 'users', 'settings'],
  },
}

describe('role access control for farm and shop', () => {
  const defaultRoleDefinitions = createDefaultRoleDefinitions()

  it.each(Object.entries(ROLE_EXPECTATIONS))('%s has the expected farm/shop workspace and module access', (role, expectation) => {
    expect(workspacesForRole(role, defaultRoleDefinitions)).toEqual(expectation.workspaces)

    expectation.allowed.forEach((moduleId) => {
      expect(canRoleAccessModule(role, moduleId, defaultRoleDefinitions), `${role} should access ${moduleId}`).toBe(true)
    })

    expectation.denied.forEach((moduleId) => {
      expect(canRoleAccessModule(role, moduleId, defaultRoleDefinitions), `${role} should not access ${moduleId}`).toBe(false)
    })
  })

  it('custom roles inherit workspace access from their base role', () => {
    const roleDefinitions = [
      ...defaultRoleDefinitions,
      {
        key: 'senior_cashier',
        name: 'Senior Cashier',
        baseRole: 'cashier',
        moduleIds: ['shop-dashboard', 'shop-orders', 'shop-customers'],
      },
      {
        key: 'farm_supervisor',
        name: 'Farm Supervisor',
        baseRole: 'manager',
        moduleIds: ['dashboard', 'flocks', 'daily-log', 'activities'],
      },
    ]

    expect(workspacesForRole('senior_cashier', roleDefinitions)).toEqual(['shop'])
    expect(workspacesForRole('farm_supervisor', roleDefinitions)).toEqual(['farm', 'shop'])
  })

  it('every default role can access at least one real module in each allowed workspace', () => {
    defaultRoleDefinitions.forEach((definition) => {
      const accessibleModules = accessibleModulesForRole(definition.key, defaultRoleDefinitions)
      const accessibleWorkspaces = new Set(accessibleModules.map((module) => module.workspace || 'farm'))

      workspacesForRole(definition.key, defaultRoleDefinitions).forEach((workspace) => {
        if (workspace === 'farm') {
          expect(accessibleWorkspaces.has('farm') || accessibleWorkspaces.has('all'), `${definition.key} needs farm modules`).toBe(true)
        }
        if (workspace === 'shop') {
          expect(accessibleWorkspaces.has('shop') || accessibleWorkspaces.has('all'), `${definition.key} needs shop modules`).toBe(true)
        }
      })
    })
  })
})
