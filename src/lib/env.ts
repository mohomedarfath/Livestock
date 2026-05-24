export const env = {
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  appName: import.meta.env.VITE_APP_NAME || 'LivestockTrack',
  enableLegacyDemo: import.meta.env.DEV && import.meta.env.VITE_ENABLE_LEGACY_DEMO === 'true',
  enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
}

export const isFirebaseConfigured = Boolean(
  env.firebaseApiKey && env.firebaseProjectId
)

// Firebase mode uses Firestore's native IndexedDB-backed offline persistence.
export const supportsOfflineSync = isFirebaseConfigured
