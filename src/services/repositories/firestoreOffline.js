import { serverTimestamp } from 'firebase/firestore'

export function writeTimestamps(includeCreated = false) {
  const clientTimestamp = new Date().toISOString()

  return {
    ...(includeCreated
      ? {
          createdAt: serverTimestamp(),
          clientCreatedAt: clientTimestamp,
        }
      : {}),
    updatedAt: serverTimestamp(),
    clientUpdatedAt: clientTimestamp,
  }
}

export function timestampToIso(value, fallback = null) {
  if (!value) return fallback
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString()
  return fallback
}

export function trackFirestoreWrite(writePromise) {
  writePromise.catch((error) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('clucktrack:firestore-write-error', {
        detail: {
          message: error?.message || 'A pending Firestore write failed.',
        },
      })
    )
  })
}
