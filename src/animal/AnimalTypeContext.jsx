import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useOrganizationSettings } from '../hooks/useOrganizationSettings'
import {
  DEFAULT_ENABLED_ANIMAL_TYPES,
  getAnimalTypeDetails,
  normalizeEnabledAnimalTypes,
  selectionOptionsFor,
} from './animalTypes'

const STORAGE_KEY = 'livestocktrack_selected_animal_type'
const AnimalTypeContext = createContext(null)

function getStoredSelection() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function saveStoredSelection(selection) {
  try {
    localStorage.setItem(STORAGE_KEY, selection)
  } catch {
    // Keep selection working in-memory if browser storage is unavailable.
  }
}

function normalizeSelection(selection, enabledTypes) {
  const enabled = normalizeEnabledAnimalTypes(enabledTypes)
  const allowAll = enabled.length > 1

  if (selection === 'all' && allowAll) return 'all'
  if (enabled.includes(selection)) return selection
  return allowAll ? 'all' : enabled[0]
}

export function AnimalTypeProvider({ children }) {
  const { settings } = useOrganizationSettings()
  const enabledAnimalTypes = useMemo(
    () => normalizeEnabledAnimalTypes(settings.enabledAnimalTypes),
    [settings.enabledAnimalTypes]
  )
  const defaultAnimalType = enabledAnimalTypes.includes(settings.defaultAnimalType)
    ? settings.defaultAnimalType
    : enabledAnimalTypes[0] || DEFAULT_ENABLED_ANIMAL_TYPES[0]

  const [storedAnimalType, setStoredAnimalType] = useState(getStoredSelection)
  const selectedType = normalizeSelection(storedAnimalType ?? defaultAnimalType, enabledAnimalTypes)
  const details = useMemo(() => getAnimalTypeDetails(selectedType), [selectedType])
  const options = useMemo(() => selectionOptionsFor(enabledAnimalTypes), [enabledAnimalTypes])

  const setSelectedAnimalType = useCallback((nextType) => {
    const normalized = normalizeSelection(nextType, enabledAnimalTypes)
    saveStoredSelection(normalized)
    setStoredAnimalType(normalized)
  }, [enabledAnimalTypes])

  const value = useMemo(
    () => ({
      selectedAnimalType: selectedType,
      setSelectedAnimalType,
      enabledAnimalTypes,
      animalTypeDetails: details,
      animalTypeOptions: options,
      isAllAnimals: selectedType === 'all',
    }),
    [details, enabledAnimalTypes, options, selectedType, setSelectedAnimalType]
  )

  return (
    <AnimalTypeContext.Provider value={value}>
      {children}
    </AnimalTypeContext.Provider>
  )
}

export function useAnimalType() {
  const value = useContext(AnimalTypeContext)
  if (!value) {
    throw new Error('useAnimalType must be used inside AnimalTypeProvider')
  }
  return value
}
