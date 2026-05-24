import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { ensureLegacySeed } from './legacyData'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

export const flockRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'flocks'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          name: data.name,
          breed: data.breed,
          type: data.type,
          count: data.count,
          age: data.age,
          status: data.status,
          arrivalDate: data.arrivalDate,
          notes: data.notes,
          createdAt: timestampToIso(data.createdAt, data.clientCreatedAt ?? null),
        }
      })
    }

    ensureLegacySeed()
    return Storage.getFlocks()
  },

  async create(organizationId, flock) {
    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(collection(db, 'organizations', organizationId, 'flocks'))
      const clientCreatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(ref, {
        name: flock.name,
        breed: flock.breed,
        type: flock.type || null,
        count: flock.count,
        age: flock.age || null,
        status: flock.status || 'active',
        arrivalDate: flock.dateAdded || flock.arrivalDate || null,
        notes: flock.notes || null,
        clientCreatedAt,
        ...writeTimestamps(true),
      }))

      return {
        id: ref.id,
        name: flock.name,
        breed: flock.breed,
        type: flock.type,
        count: flock.count,
        age: flock.age,
        status: flock.status || 'active',
        arrivalDate: flock.dateAdded || flock.arrivalDate || null,
        notes: flock.notes,
        createdAt: clientCreatedAt,
        penNumber: flock.penNumber || '',
        dateAdded: flock.dateAdded || flock.arrivalDate || null,
      }
    }

    ensureLegacySeed()
    const nextFlock = { id: `flock_${Date.now()}`, ...flock }
    Storage.setFlocks([...Storage.getFlocks(), nextFlock])
    return nextFlock
  },

  async remove(organizationId, flockId) {
    if (isFirebaseConfigured && db && organizationId) {
      trackFirestoreWrite(deleteDoc(doc(db, 'organizations', organizationId, 'flocks', flockId)))
      return
    }

    ensureLegacySeed()
    Storage.setFlocks(Storage.getFlocks().filter((flock) => flock.id !== flockId))
  },
}
