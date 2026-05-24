import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function readLocalLogs() {
  return JSON.parse(localStorage.getItem('clucktrack_logs') || '[]')
}

function normalizeLog(log) {
  return {
    id: log.id,
    date: log.date || log.log_date,
    time: log.time || null,
    flockId: log.flockId ?? log.flock_id ?? null,
    flockName: log.flockName ?? log.flock_name ?? '',
    eggs: Number(log.eggs ?? log.eggs_collected ?? 0),
    deaths: Number(log.deaths ?? log.mortality ?? 0),
    feed: Number(log.feed ?? log.feed_given ?? 0),
    water: Number(log.water ?? log.water_consumed ?? 0),
    notes: log.notes || '',
    createdAt: timestampToIso(log.createdAt, log.clientCreatedAt ?? log.created_at ?? null),
  }
}

export const dailyLogRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'dailyLogs'),
        orderBy('date', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => normalizeLog({ id: d.id, ...d.data() }))
    }

    return readLocalLogs().map(normalizeLog).sort((left, right) => {
      const leftStamp = `${left.date || ''}T${left.time || '00:00'}`
      const rightStamp = `${right.date || ''}T${right.time || '00:00'}`
      return rightStamp.localeCompare(leftStamp)
    })
  },

  async create(organizationId, log) {
    if (!isFirebaseConfigured || !db || !organizationId) {
      return log
    }

    const ref = doc(collection(db, 'organizations', organizationId, 'dailyLogs'))
    const clientCreatedAt = new Date().toISOString()
    trackFirestoreWrite(setDoc(ref, {
      date: log.date,
      flockId: log.flockId || null,
      flockName: log.flockName || '',
      eggs: log.eggs ?? 0,
      deaths: log.deaths ?? 0,
      feed: log.feed ?? 0,
      water: log.water ?? 0,
      notes: log.notes || null,
      clientCreatedAt,
      ...writeTimestamps(true),
    }))

    return normalizeLog({ ...log, id: ref.id, clientCreatedAt })
  },
}
