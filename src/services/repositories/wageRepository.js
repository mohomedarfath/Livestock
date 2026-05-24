import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { ensureLegacySeed } from './legacyData'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function normalizeWage(wage) {
  return {
    id: wage.id,
    employeeId: wage.employeeId ?? wage.employee_id,
    employeeName: wage.employeeName ?? wage.employee_name ?? '',
    month: String(wage.month ?? wage.wage_month ?? wage.period).slice(0, 7),
    hoursWorked: Number(wage.hoursWorked ?? wage.hours_worked ?? wage.hours ?? 0),
    rate: Number(wage.rate || 0),
    wageType: wage.wageType ?? wage.wage_type ?? 'hourly',
    calculatedWage: Number(wage.calculatedWage ?? wage.calculated_wage ?? wage.amount ?? 0),
    status: wage.status || (wage.paid === true ? 'paid' : 'pending'),
    paidAt: wage.paidAt ?? wage.paid_at ?? wage.paidDate ?? null,
    notes: wage.notes || '',
    createdAt: timestampToIso(wage.createdAt, wage.clientCreatedAt ?? wage.created_at ?? null),
  }
}

export const wageRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'wages'),
        orderBy('month', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => normalizeWage({ id: d.id, ...d.data() }))
    }

    ensureLegacySeed()
    return Storage.getWages().map(normalizeWage)
  },

  async saveMonth(organizationId, month, rows) {
    if (isFirebaseConfigured && db && organizationId) {
      for (const row of rows) {
        // Use employeeId_month as document ID for natural upsert
        const docId = `${row.employeeId}_${month}`
        const clientUpdatedAt = new Date().toISOString()
        trackFirestoreWrite(setDoc(doc(db, 'organizations', organizationId, 'wages', docId), {
          employeeId: row.employeeId,
          employeeName: row.employeeName || '',
          month,
          hoursWorked: Number(row.hoursWorked || 0),
          rate: Number(row.rate || 0),
          wageType: row.wageType,
          calculatedWage: Number(row.calculatedWage || 0),
          status: row.status || 'pending',
          paidAt: row.paidAt || null,
          notes: row.notes || null,
          clientUpdatedAt,
          ...writeTimestamps(true),
        }, { merge: true }))
      }
      return
    }

    ensureLegacySeed()
    const existing = Storage.getWages().filter((wage) => normalizeWage(wage).month !== month)
    const nextRows = rows.map((row) =>
      normalizeWage({ id: Date.now() + Math.random(), ...row, month })
    )
    Storage.setWages([...existing, ...nextRows])
  },

  async markPaid(organizationId, employeeId, month, payload) {
    if (isFirebaseConfigured && db && organizationId) {
      const docId = `${employeeId}_${month}`
      const clientUpdatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(doc(db, 'organizations', organizationId, 'wages', docId), {
        employeeId,
        month,
        hoursWorked: Number(payload.hoursWorked || 0),
        rate: Number(payload.rate || 0),
        wageType: payload.wageType,
        calculatedWage: Number(payload.calculatedWage || 0),
        status: 'paid',
        paidAt: payload.paidAt || new Date().toISOString().split('T')[0],
        notes: payload.notes || null,
        clientUpdatedAt,
        ...writeTimestamps(true),
      }, { merge: true }))
      return
    }

    ensureLegacySeed()
    const wages = Storage.getWages()
    const existing = wages.find(
      (wage) => normalizeWage(wage).employeeId === employeeId && normalizeWage(wage).month === month
    )
    const nextRow = normalizeWage({
      id: existing?.id || Date.now(),
      ...payload,
      employeeId,
      month,
      status: 'paid',
      paidAt: payload.paidAt || new Date().toISOString().split('T')[0],
    })
    const updated = existing
      ? wages.map((wage) =>
          normalizeWage(wage).employeeId === employeeId && normalizeWage(wage).month === month
            ? nextRow
            : wage
        )
      : [...wages, nextRow]
    Storage.setWages(updated)
  },
}
