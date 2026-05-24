import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { trackFirestoreWrite, writeTimestamps } from './firestoreOffline'
import { DEFAULT_ENABLED_ANIMAL_TYPES, normalizeEnabledAnimalTypes } from '../../animal/animalTypes'

function normalizeSettings(settings = {}, fallbackFarmName = 'CluckTrack Pro') {
  const enabledAnimalTypes = normalizeEnabledAnimalTypes(
    settings.enabledAnimalTypes || settings.enabled_animal_types
  )

  return {
    farmName: settings.farmName || settings.farm_name || fallbackFarmName,
    logo: settings.logo ?? settings.logo_url ?? null,
    currency: settings.currency || settings.currency_code || 'LKR',
    address: settings.address || '',
    enabledAnimalTypes,
    defaultAnimalType:
      enabledAnimalTypes.includes(settings.defaultAnimalType || settings.default_animal_type)
        ? settings.defaultAnimalType || settings.default_animal_type
        : enabledAnimalTypes[0] || DEFAULT_ENABLED_ANIMAL_TYPES[0],
  }
}

export const organizationSettingsRepository = {
  async get(organizationId, fallbackFarmName = 'CluckTrack Pro') {
    if (isFirebaseConfigured && db && organizationId) {
      const settingsSnap = await getDoc(doc(db, 'organizations', organizationId, 'settings', 'config'))
      const nextSettings = normalizeSettings(settingsSnap.exists() ? settingsSnap.data() : {}, fallbackFarmName)
      return nextSettings
    }

    return normalizeSettings(Storage.getSettings(), fallbackFarmName)
  },

  async save(organizationId, settings, fallbackFarmName = 'CluckTrack Pro') {
    const normalized = normalizeSettings(settings, fallbackFarmName)

    if (isFirebaseConfigured && db && organizationId) {
      trackFirestoreWrite(setDoc(doc(db, 'organizations', organizationId, 'settings', 'config'), {
        ...normalized,
        ...writeTimestamps(),
      }, { merge: true }))
      return normalized
    }

    Storage.setSettings(normalized)
    return normalized
  },
}
