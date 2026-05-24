import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { ensureLegacySeed } from './legacyData'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function normalizeActivity(activity) {
  return {
    id: activity.id,
    employeeId: activity.employeeId ?? activity.employee_id ?? null,
    employeeName: activity.employeeName ?? activity.employee_name ?? '',
    flockId: activity.flockId ?? activity.flock_id ?? null,
    flockName: activity.flockName ?? activity.flock_name ?? '',
    taskType: activity.taskType ?? activity.task_type ?? 'Other',
    description: activity.description || '',
    hours: Number(activity.hours || 0),
    date: activity.date ?? activity.activity_date,
    time: activity.time ?? activity.activity_time ?? '',
    notes: activity.notes || '',
    createdAt: timestampToIso(activity.createdAt, activity.clientCreatedAt ?? activity.created_at ?? null),
  }
}

export const activityRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'activities'),
        orderBy('date', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => normalizeActivity({ id: d.id, ...d.data() }))
    }

    ensureLegacySeed()
    return Storage.getActivities().map(normalizeActivity)
  },

  async create(organizationId, activity) {
    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(collection(db, 'organizations', organizationId, 'activities'))
      const clientCreatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(ref, {
        employeeId: activity.employeeId,
        employeeName: activity.employeeName || '',
        flockId: activity.flockId || null,
        flockName: activity.flockName || '',
        taskType: activity.taskType,
        description: activity.description,
        hours: activity.hours,
        date: activity.date,
        time: activity.time || null,
        notes: activity.notes || null,
        clientCreatedAt,
        ...writeTimestamps(true),
      }))
      return normalizeActivity({ ...activity, id: ref.id, clientCreatedAt })
    }

    ensureLegacySeed()
    const nextActivity = normalizeActivity({
      id: Date.now(),
      ...activity,
      createdAt: new Date().toISOString(),
    })
    Storage.setActivities([nextActivity, ...Storage.getActivities()])
    return nextActivity
  },
}
