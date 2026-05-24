import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { isFirebaseConfigured } from '../lib/env'
import { useConnectivity } from '../hooks/useConnectivity'
import { useAuth } from './AuthContext'
import { useTenant } from './TenantContext'

const SyncStatusContext = createContext(null)

const WORKSPACE_COLLECTIONS = [
  'activities',
  'budgets',
  'dailyLogs',
  'employees',
  'expenses',
  'feedPurchases',
  'flocks',
  'sales',
  'vaccinations',
  'wages',
]

const WORKSPACE_DOCS = [
  ['farmInventory', 'state'],
  ['settings', 'config'],
]

function countPendingDocs(snapshot) {
  if ('docs' in snapshot) {
    return snapshot.docs.filter((entry) => entry.metadata.hasPendingWrites).length
  }

  return snapshot.metadata.hasPendingWrites ? 1 : 0
}

function resolveSyncState({ isOnline, pendingWrites, listening }) {
  if (!isFirebaseConfigured) return 'local'
  if (pendingWrites > 0) return isOnline ? 'syncing' : 'pending'
  if (!isOnline) return 'offline'
  return listening ? 'synced' : 'online'
}

export function SyncStatusProvider({ children }) {
  const isOnline = useConnectivity()
  const { user } = useAuth()
  const { currentOrganization } = useTenant()
  const [pendingBySource, setPendingBySource] = useState({})
  const [fromCacheBySource, setFromCacheBySource] = useState({})
  const [lastError, setLastError] = useState('')
  const [listening, setListening] = useState(false)

  useEffect(() => {
    setPendingBySource({})
    setFromCacheBySource({})
    setListening(false)

    if (!isFirebaseConfigured || !db) return undefined

    const subscriptions = []
    const setSource = (source, snapshot) => {
      setPendingBySource((current) => ({
        ...current,
        [source]: countPendingDocs(snapshot),
      }))
      setFromCacheBySource((current) => ({
        ...current,
        [source]: snapshot.metadata.fromCache,
      }))
      setListening(true)
    }

    const listen = (source, ref) => {
      subscriptions.push(
        onSnapshot(
          ref,
          { includeMetadataChanges: true },
          (snapshot) => setSource(source, snapshot),
          (error) => {
            setLastError(error.message || 'Sync listener failed.')
          }
        )
      )
    }

    if (user?.id) {
      listen(`users/${user.id}`, doc(db, 'users', user.id))
    }

    if (currentOrganization?.id) {
      listen(
        `organizations/${currentOrganization.id}`,
        doc(db, 'organizations', currentOrganization.id)
      )

      WORKSPACE_COLLECTIONS.forEach((collectionName) => {
        listen(
          collectionName,
          collection(db, 'organizations', currentOrganization.id, collectionName)
        )
      })

      WORKSPACE_DOCS.forEach(([collectionName, docId]) => {
        listen(
          `${collectionName}/${docId}`,
          doc(db, 'organizations', currentOrganization.id, collectionName, docId)
        )
      })
    }

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe())
    }
  }, [currentOrganization?.id, user?.id])

  useEffect(() => {
    function handleWriteError(event) {
      setLastError(event.detail?.message || 'A pending Firestore write failed.')
    }

    window.addEventListener('clucktrack:firestore-write-error', handleWriteError)
    return () => window.removeEventListener('clucktrack:firestore-write-error', handleWriteError)
  }, [])

  const pendingWrites = useMemo(
    () => Object.values(pendingBySource).reduce((sum, count) => sum + count, 0),
    [pendingBySource]
  )
  const fromCache = useMemo(
    () => Object.values(fromCacheBySource).some(Boolean),
    [fromCacheBySource]
  )
  const syncState = resolveSyncState({ isOnline, pendingWrites, listening })

  const value = useMemo(
    () => ({
      isOnline,
      pendingWrites,
      fromCache,
      syncState,
      lastError,
      listening,
      clearSyncError: () => setLastError(''),
    }),
    [fromCache, isOnline, lastError, listening, pendingWrites, syncState]
  )

  return <SyncStatusContext.Provider value={value}>{children}</SyncStatusContext.Provider>
}

// Hook lives with the provider so consumers share the same fallback contract.
// eslint-disable-next-line react-refresh/only-export-components
export function useSyncStatus() {
  const value = useContext(SyncStatusContext)
  if (!value) {
    return {
      isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
      pendingWrites: 0,
      fromCache: false,
      syncState: 'online',
      lastError: '',
      listening: false,
      clearSyncError: () => {},
    }
  }
  return value
}
