import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { ensureLegacySeed } from './legacyData'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function normalizeEmployee(employee) {
  return {
    id: employee.id,
    userId: employee.userId ?? employee.user_id ?? null,
    name: employee.name || '',
    role: employee.role || '',
    wageType: employee.wageType ?? employee.wage_type ?? 'hourly',
    rate: Number(employee.rate || 0),
    phone: employee.phone || '',
    notes: employee.notes || '',
    active: employee.active !== false,
    joinedAt: employee.joinedAt ?? employee.joined_at ?? null,
    createdAt: timestampToIso(employee.createdAt, employee.clientCreatedAt ?? employee.created_at ?? null),
  }
}

export const employeeRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'employees'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => normalizeEmployee({ id: d.id, ...d.data() }))
    }

    ensureLegacySeed()
    return Storage.getEmployees().map(normalizeEmployee)
  },

  async create(organizationId, employee) {
    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(collection(db, 'organizations', organizationId, 'employees'))
      const clientCreatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(ref, {
        userId: employee.userId || null,
        name: employee.name,
        role: employee.role,
        wageType: employee.wageType,
        rate: employee.rate,
        active: employee.active ?? true,
        joinedAt: employee.joinedAt || new Date().toISOString().split('T')[0],
        phone: employee.phone || null,
        notes: employee.notes || null,
        clientCreatedAt,
        ...writeTimestamps(true),
      }))
      return normalizeEmployee({ ...employee, id: ref.id, clientCreatedAt })
    }

    ensureLegacySeed()
    const nextEmployee = normalizeEmployee({
      id: `emp_${Date.now()}`,
      ...employee,
      joinedAt: employee.joinedAt || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    })
    Storage.setEmployees([...Storage.getEmployees(), nextEmployee])
    return nextEmployee
  },

  async toggleActive(organizationId, employeeId) {
    if (isFirebaseConfigured && db && organizationId) {
      const employees = await this.list(organizationId)
      const target = employees.find((employee) => employee.id === employeeId)
      if (!target) throw new Error('Employee not found.')
      trackFirestoreWrite(updateDoc(doc(db, 'organizations', organizationId, 'employees', employeeId), {
        active: !target.active,
        ...writeTimestamps(),
      }))
      return
    }

    ensureLegacySeed()
    Storage.setEmployees(
      Storage.getEmployees().map((employee) =>
        employee.id === employeeId ? { ...employee, active: employee.active === false } : employee
      )
    )
  },

  async remove(organizationId, employeeId) {
    if (isFirebaseConfigured && db && organizationId) {
      trackFirestoreWrite(deleteDoc(doc(db, 'organizations', organizationId, 'employees', employeeId)))
      return
    }

    ensureLegacySeed()
    Storage.setEmployees(Storage.getEmployees().filter((employee) => employee.id !== employeeId))
  },
}
