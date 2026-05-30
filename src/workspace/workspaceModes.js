export const WORKSPACE_MODES = {
  farm: {
    id: 'farm',
    label: 'Farm',
    shortLabel: 'Farm',
    description: 'Farm operations, livestock, inventory, people, and finance.',
  },
  shop: {
    id: 'shop',
    label: 'Shop',
    shortLabel: 'Shop',
    description: 'Retail products, point of sale, orders, and customers.',
  },
}

export function getModuleWorkspace(module) {
  return module?.workspace || 'farm'
}

export function isModuleEnabledForWorkspace(module, workspaceMode) {
  if (!module) return true
  const moduleWorkspace = getModuleWorkspace(module)
  if (moduleWorkspace === 'all') return true
  return moduleWorkspace === (workspaceMode || 'farm')
}
