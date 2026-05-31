function cleanEnvValue(value: unknown) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  const lower = trimmed.toLowerCase()
  const placeholderPatterns = [
    /^your[-_\s]?/,
    /^replace[-_\s]?/,
    /^<.*>$/,
  ]

  if (!trimmed || placeholderPatterns.some((pattern) => pattern.test(lower))) {
    return ''
  }

  return trimmed
}

export const env = {
  firebaseApiKey: cleanEnvValue(import.meta.env.VITE_FIREBASE_API_KEY),
  firebaseAuthDomain: cleanEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  firebaseProjectId: cleanEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  firebaseStorageBucket: cleanEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  firebaseMessagingSenderId: cleanEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  firebaseAppId: cleanEnvValue(import.meta.env.VITE_FIREBASE_APP_ID),
  appName: cleanEnvValue(import.meta.env.VITE_APP_NAME) || 'LivestockTrack',
  enableLegacyDemo: import.meta.env.DEV && import.meta.env.VITE_ENABLE_LEGACY_DEMO === 'true',
  enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
}

export const isFirebaseConfigured = Boolean(
  env.firebaseApiKey && env.firebaseProjectId
)

// Firebase mode uses Firestore's native IndexedDB-backed offline persistence.
export const supportsOfflineSync = isFirebaseConfigured
