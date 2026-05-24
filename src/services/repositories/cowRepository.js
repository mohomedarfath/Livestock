import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, deleteDoc, doc, getDocs, query, orderBy, setDoc } from 'firebase/firestore'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

const LOCAL_KEYS = {
  cows: 'cowtrack_cows',
  milkLogs: 'cowtrack_milk_logs',
  breedingRecords: 'cowtrack_breeding_records',
  healthRecords: 'cowtrack_health_records',
  milkPayments: 'cowtrack_milk_payments',
}

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function writeLocal(key, records) {
  localStorage.setItem(key, JSON.stringify(records))
}

function localId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

function collectionRef(organizationId, name) {
  return collection(db, 'organizations', organizationId, name)
}

function normalizeCow(cow) {
  return {
    id: cow.id,
    name: cow.name || '',
    tagNumber: cow.tagNumber ?? cow.tag_number ?? '',
    breed: cow.breed || '',
    dateOfBirth: cow.dateOfBirth ?? cow.date_of_birth ?? '',
    status: cow.status || 'milking',
    lactationNumber: Number(cow.lactationNumber ?? cow.lactation_number ?? 0),
    lastCalvingDate: cow.lastCalvingDate ?? cow.last_calving_date ?? '',
    purchasePrice: Number(cow.purchasePrice ?? cow.purchase_price ?? 0),
    photoUrl: cow.photoUrl ?? cow.photo_url ?? '',
    notes: cow.notes || '',
    createdAt: timestampToIso(cow.createdAt, cow.clientCreatedAt ?? cow.created_at ?? null),
  }
}

function normalizeMilkLog(log) {
  const morningLitres = Number(log.morningLitres ?? log.morning_litres ?? 0)
  const eveningLitres = Number(log.eveningLitres ?? log.evening_litres ?? 0)
  const rejectedLitres = Number(log.rejectedLitres ?? log.rejected_litres ?? 0)

  return {
    id: log.id,
    cowId: log.cowId ?? log.cow_id ?? null,
    cowName: log.cowName ?? log.cow_name ?? '',
    date: log.date || log.log_date,
    morningLitres,
    eveningLitres,
    rejectedLitres,
    totalLitres: Math.max(0, morningLitres + eveningLitres - rejectedLitres),
    fatPercent: Number(log.fatPercent ?? log.fat_percent ?? 0),
    snfPercent: Number(log.snfPercent ?? log.snf_percent ?? 0),
    notes: log.notes || '',
    createdAt: timestampToIso(log.createdAt, log.clientCreatedAt ?? log.created_at ?? null),
  }
}

function normalizeBreedingRecord(record) {
  return {
    id: record.id,
    cowId: record.cowId ?? record.cow_id ?? null,
    cowName: record.cowName ?? record.cow_name ?? '',
    eventType: record.eventType ?? record.event_type ?? 'heat',
    eventDate: record.eventDate ?? record.event_date ?? '',
    aiDate: record.aiDate ?? record.ai_date ?? '',
    pregnancyCheckDate: record.pregnancyCheckDate ?? record.pregnancy_check_date ?? '',
    pregnancyResult: record.pregnancyResult ?? record.pregnancy_result ?? '',
    expectedCalvingDate: record.expectedCalvingDate ?? record.expected_calving_date ?? '',
    dryOffDate: record.dryOffDate ?? record.dry_off_date ?? '',
    sireBull: record.sireBull ?? record.sire_bull ?? '',
    technician: record.technician || '',
    notes: record.notes || '',
    createdAt: timestampToIso(record.createdAt, record.clientCreatedAt ?? record.created_at ?? null),
  }
}

function normalizeHealthRecord(record) {
  const eventDate = record.eventDate ?? record.event_date ?? ''
  const withdrawalDays = Number(record.withdrawalDays ?? record.withdrawal_days ?? 0)
  let withdrawalUntil = record.withdrawalUntil ?? record.withdrawal_until ?? ''

  if (!withdrawalUntil && eventDate && withdrawalDays > 0) {
    const endDate = new Date(`${eventDate}T00:00:00`)
    endDate.setDate(endDate.getDate() + withdrawalDays)
    withdrawalUntil = endDate.toISOString().split('T')[0]
  }

  return {
    id: record.id,
    cowId: record.cowId ?? record.cow_id ?? null,
    cowName: record.cowName ?? record.cow_name ?? '',
    issueType: record.issueType ?? record.issue_type ?? '',
    symptoms: record.symptoms || '',
    medicine: record.medicine || '',
    dose: record.dose || '',
    vetName: record.vetName ?? record.vet_name ?? '',
    eventDate,
    withdrawalDays,
    withdrawalUntil,
    cost: Number(record.cost || 0),
    notes: record.notes || '',
    createdAt: timestampToIso(record.createdAt, record.clientCreatedAt ?? record.created_at ?? null),
  }
}

function normalizeMilkPayment(payment) {
  const litres = Number(payment.litres || 0)
  const rate = Number(payment.rate || 0)
  const fatSnfBonus = Number(payment.fatSnfBonus ?? payment.fat_snf_bonus ?? 0)
  const deductions = Number(payment.deductions || 0)
  const expectedPayment = Number(payment.expectedPayment ?? payment.expected_payment ?? ((litres * rate) + fatSnfBonus - deductions))

  return {
    id: payment.id,
    fromDate: payment.fromDate ?? payment.from_date ?? '',
    toDate: payment.toDate ?? payment.to_date ?? '',
    buyerName: payment.buyerName ?? payment.buyer_name ?? '',
    litres,
    rate,
    fatSnfBonus,
    deductions,
    expectedPayment,
    actualPayment: Number(payment.actualPayment ?? payment.actual_payment ?? expectedPayment),
    notes: payment.notes || '',
    createdAt: timestampToIso(payment.createdAt, payment.clientCreatedAt ?? payment.created_at ?? null),
  }
}

function makeRepository({ collectionName, localKey, prefix, normalize, orderField, toFirestore }) {
  return {
    async list(organizationId) {
      if (isFirebaseConfigured && db && organizationId) {
        const q = query(collectionRef(organizationId, collectionName), orderBy(orderField, 'desc'))
        const snapshot = await getDocs(q)
        return snapshot.docs.map((d) => normalize({ id: d.id, ...d.data() }))
      }

      return readLocal(localKey).map(normalize).sort((left, right) =>
        String(right[orderField] || right.createdAt || '').localeCompare(String(left[orderField] || left.createdAt || ''))
      )
    },

    async create(organizationId, record) {
      if (isFirebaseConfigured && db && organizationId) {
        const ref = doc(collectionRef(organizationId, collectionName))
        const clientCreatedAt = new Date().toISOString()
        trackFirestoreWrite(setDoc(ref, {
          ...toFirestore(record),
          clientCreatedAt,
          ...writeTimestamps(true),
        }))
        return normalize({ ...record, id: ref.id, clientCreatedAt })
      }

      const created = normalize({
        id: localId(prefix),
        ...record,
        createdAt: new Date().toISOString(),
      })
      writeLocal(localKey, [created, ...readLocal(localKey)])
      return created
    },

    async remove(organizationId, recordId) {
      if (isFirebaseConfigured && db && organizationId) {
        trackFirestoreWrite(deleteDoc(doc(db, 'organizations', organizationId, collectionName, recordId)))
        return
      }

      writeLocal(localKey, readLocal(localKey).filter((record) => record.id !== recordId))
    },
  }
}

export const cowRepository = makeRepository({
  collectionName: 'cows',
  localKey: LOCAL_KEYS.cows,
  prefix: 'cow',
  normalize: normalizeCow,
  orderField: 'createdAt',
  toFirestore: (cow) => ({
    name: cow.name,
    tagNumber: cow.tagNumber,
    breed: cow.breed,
    dateOfBirth: cow.dateOfBirth || null,
    status: cow.status || 'milking',
    lactationNumber: Number(cow.lactationNumber || 0),
    lastCalvingDate: cow.lastCalvingDate || null,
    purchasePrice: Number(cow.purchasePrice || 0),
    photoUrl: cow.photoUrl || null,
    notes: cow.notes || null,
  }),
})

export const cowMilkLogRepository = makeRepository({
  collectionName: 'cowMilkLogs',
  localKey: LOCAL_KEYS.milkLogs,
  prefix: 'milk',
  normalize: normalizeMilkLog,
  orderField: 'date',
  toFirestore: (log) => ({
    cowId: log.cowId || null,
    cowName: log.cowName || '',
    date: log.date,
    morningLitres: Number(log.morningLitres || 0),
    eveningLitres: Number(log.eveningLitres || 0),
    rejectedLitres: Number(log.rejectedLitres || 0),
    fatPercent: Number(log.fatPercent || 0),
    snfPercent: Number(log.snfPercent || 0),
    notes: log.notes || null,
  }),
})

export const cowBreedingRepository = makeRepository({
  collectionName: 'cowBreedingRecords',
  localKey: LOCAL_KEYS.breedingRecords,
  prefix: 'breed',
  normalize: normalizeBreedingRecord,
  orderField: 'eventDate',
  toFirestore: (record) => ({
    cowId: record.cowId || null,
    cowName: record.cowName || '',
    eventType: record.eventType || 'heat',
    eventDate: record.eventDate,
    aiDate: record.aiDate || null,
    pregnancyCheckDate: record.pregnancyCheckDate || null,
    pregnancyResult: record.pregnancyResult || null,
    expectedCalvingDate: record.expectedCalvingDate || null,
    dryOffDate: record.dryOffDate || null,
    sireBull: record.sireBull || null,
    technician: record.technician || null,
    notes: record.notes || null,
  }),
})

export const cowHealthRepository = makeRepository({
  collectionName: 'cowHealthRecords',
  localKey: LOCAL_KEYS.healthRecords,
  prefix: 'health',
  normalize: normalizeHealthRecord,
  orderField: 'eventDate',
  toFirestore: (record) => ({
    cowId: record.cowId || null,
    cowName: record.cowName || '',
    issueType: record.issueType,
    symptoms: record.symptoms || null,
    medicine: record.medicine || null,
    dose: record.dose || null,
    vetName: record.vetName || null,
    eventDate: record.eventDate,
    withdrawalDays: Number(record.withdrawalDays || 0),
    withdrawalUntil: record.withdrawalUntil || null,
    cost: Number(record.cost || 0),
    notes: record.notes || null,
  }),
})

export const milkPaymentRepository = makeRepository({
  collectionName: 'milkPayments',
  localKey: LOCAL_KEYS.milkPayments,
  prefix: 'payment',
  normalize: normalizeMilkPayment,
  orderField: 'toDate',
  toFirestore: (payment) => ({
    fromDate: payment.fromDate,
    toDate: payment.toDate,
    buyerName: payment.buyerName || '',
    litres: Number(payment.litres || 0),
    rate: Number(payment.rate || 0),
    fatSnfBonus: Number(payment.fatSnfBonus || 0),
    deductions: Number(payment.deductions || 0),
    expectedPayment: Number(payment.expectedPayment || 0),
    actualPayment: Number(payment.actualPayment || 0),
    notes: payment.notes || null,
  }),
})
