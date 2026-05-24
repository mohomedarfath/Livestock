import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { ensureLegacySeed } from './legacyData'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function normalizeVaccination(vaccination) {
  return {
    id: vaccination.id,
    name: vaccination.name,
    dueDate: vaccination.dueDate ?? vaccination.due_date,
    flock: vaccination.flock ?? vaccination.flock_name ?? '',
    flockId: vaccination.flockId ?? vaccination.flock_id ?? null,
    status: vaccination.status === 'done' ? 'completed' : vaccination.status,
    notes: vaccination.notes || '',
    createdAt: timestampToIso(vaccination.createdAt, vaccination.clientCreatedAt ?? vaccination.created_at ?? null),
  }
}

export const vaccinationRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'vaccinations'),
        orderBy('dueDate', 'asc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => normalizeVaccination({ id: d.id, ...d.data() }))
    }

    ensureLegacySeed()
    return Storage.getVaccinations().map(normalizeVaccination)
  },

  async create(organizationId, vaccination) {
    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(collection(db, 'organizations', organizationId, 'vaccinations'))
      const clientCreatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(ref, {
        name: vaccination.name,
        dueDate: vaccination.dueDate,
        flockId: vaccination.flockId || null,
        flock: vaccination.flock || '',
        status: vaccination.status,
        notes: vaccination.notes || null,
        clientCreatedAt,
        ...writeTimestamps(true),
      }))
      return normalizeVaccination({ ...vaccination, id: ref.id, clientCreatedAt })
    }

    ensureLegacySeed()
    const nextVaccination = normalizeVaccination({
      id: `vac_${Date.now()}`,
      ...vaccination,
      createdAt: new Date().toISOString(),
    })
    Storage.setVaccinations([...Storage.getVaccinations(), nextVaccination])
    return nextVaccination
  },

  async updateStatus(organizationId, vaccinationId, status) {
    if (isFirebaseConfigured && db && organizationId) {
      trackFirestoreWrite(updateDoc(doc(db, 'organizations', organizationId, 'vaccinations', vaccinationId), {
        status,
        ...writeTimestamps(),
      }))
      return
    }

    ensureLegacySeed()
    Storage.setVaccinations(
      Storage.getVaccinations().map((vaccination) =>
        vaccination.id === vaccinationId ? { ...vaccination, status } : vaccination
      )
    )
  },

  async remove(organizationId, vaccinationId) {
    if (isFirebaseConfigured && db && organizationId) {
      trackFirestoreWrite(deleteDoc(doc(db, 'organizations', organizationId, 'vaccinations', vaccinationId)))
      return
    }

    ensureLegacySeed()
    Storage.setVaccinations(
      Storage.getVaccinations().filter((vaccination) => vaccination.id !== vaccinationId)
    )
  },
}
