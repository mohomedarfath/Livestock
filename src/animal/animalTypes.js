export const ANIMAL_TYPES = {
  poultry: {
    id: 'poultry',
    label: 'Poultry',
    shortLabel: 'Poultry',
    icon: 'Bird',
    emoji: '🐔',
    groupLabel: 'Flock',
    groupPlural: 'Flocks',
    groupManagerTitle: 'Flock Manager',
    animalLabel: 'Bird',
    animalPlural: 'Birds',
    productLabel: 'Eggs, birds, and meat',
    healthSubject: 'flock',
    dashboardMetric: 'Flocks',
    stockUnit: 'birds',
    hiddenModules: [
      'cow-dashboard',
      'cow-herd',
      'cow-milk-log',
      'milk-passbook',
      'cow-breeding',
      'cow-health',
      'cow-profit',
    ],
  },
  goat: {
    id: 'goat',
    label: 'Goat',
    shortLabel: 'Goats',
    icon: 'Goat',
    emoji: '🐐',
    groupLabel: 'Goat Herd',
    groupPlural: 'Goat Herds',
    groupManagerTitle: 'Goat Herd Manager',
    animalLabel: 'Goat',
    animalPlural: 'Goats',
    productLabel: 'Live goats, meat, and manure',
    healthSubject: 'herd',
    dashboardMetric: 'Herds',
    stockUnit: 'goats',
    hiddenModules: [
      'incubation',
      'cow-dashboard',
      'cow-herd',
      'cow-milk-log',
      'milk-passbook',
      'cow-breeding',
      'cow-health',
      'cow-profit',
    ],
  },
  cow: {
    id: 'cow',
    label: 'Cow',
    shortLabel: 'Cattle',
    icon: 'Cow',
    emoji: '🐄',
    groupLabel: 'Cattle Herd',
    groupPlural: 'Cattle Herds',
    groupManagerTitle: 'Cattle Herd Manager',
    animalLabel: 'Cow',
    animalPlural: 'Cattle',
    productLabel: 'Live cattle, meat, and manure',
    healthSubject: 'herd',
    dashboardMetric: 'Herds',
    stockUnit: 'cattle',
    hiddenModules: [
      'flocks',
      'daily-log',
      'vaccinations',
      'medicine',
      'fcr',
      'incubation',
      'sales',
      'profit',
    ],
  },
}

export const ALL_ANIMALS = {
  id: 'all',
  label: 'All Animals',
  shortLabel: 'All',
  icon: 'Package',
  emoji: '🐾',
  groupLabel: 'Animal Group',
  groupPlural: 'Animal Groups',
  groupManagerTitle: 'Animal Group Manager',
  animalLabel: 'Animal',
  animalPlural: 'Animals',
  productLabel: 'Animals, products, and supplies',
  healthSubject: 'animals',
  dashboardMetric: 'Groups',
  stockUnit: 'animals',
  hiddenModules: [],
}

export const DEFAULT_ENABLED_ANIMAL_TYPES = ['poultry', 'goat', 'cow']

export function normalizeEnabledAnimalTypes(value) {
  if (!Array.isArray(value)) return DEFAULT_ENABLED_ANIMAL_TYPES

  const validTypes = value.filter((type) => Boolean(ANIMAL_TYPES[type]))
  return validTypes.length > 0 ? Array.from(new Set(validTypes)) : DEFAULT_ENABLED_ANIMAL_TYPES
}

export function getAnimalTypeDetails(type) {
  if (type === 'all') return ALL_ANIMALS
  return ANIMAL_TYPES[type] || ANIMAL_TYPES.poultry
}

export function selectionOptionsFor(enabledTypes) {
  const enabled = normalizeEnabledAnimalTypes(enabledTypes)
  const options = enabled.map((type) => ANIMAL_TYPES[type])

  return enabled.length > 1 ? [ALL_ANIMALS, ...options] : options
}

export function isModuleEnabledForAnimalType(moduleId, selectedType, enabledTypes) {
  if (!moduleId) return true

  if (selectedType === 'all') {
    return normalizeEnabledAnimalTypes(enabledTypes).some((type) => {
      const details = getAnimalTypeDetails(type)
      return !details.hiddenModules.includes(moduleId)
    })
  }

  const details = getAnimalTypeDetails(selectedType)
  return !details.hiddenModules.includes(moduleId)
}

export function animalizeModule(module, details) {
  if (!module) return module

  if (module.id === 'flocks') {
    return {
      ...module,
      label: details.groupPlural,
      title: details.groupManagerTitle,
    }
  }

  if (module.id === 'fcr') {
    return {
      ...module,
      label: details.id === 'poultry' ? 'FCR' : 'Feed Efficiency',
      title: details.id === 'poultry' ? 'FCR Calculator' : 'Feed Efficiency Calculator',
    }
  }

  if (module.id === 'inventory') {
    if (details.id === 'cow') {
      return {
        ...module,
        label: 'Cattle Inventory',
        title: 'Cattle Inventory',
        icon: 'Cow',
      }
    }

    if (details.id === 'goat') {
      return {
        ...module,
        label: 'Goat Inventory',
        title: 'Goat Inventory',
        icon: 'Goat',
      }
    }
  }

  if (module.id === 'feed' && details.id !== 'poultry') {
    return {
      ...module,
      label: details.id === 'cow' ? 'Cattle Feed' : 'Goat Feed',
      title: details.id === 'cow' ? 'Cattle Feed Costs' : 'Goat Feed Costs',
    }
  }

  return module
}
