import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { ensureLegacySeed } from './legacyData'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function normalizeExpense(expense) {
  return {
    id: expense.id,
    date: expense.date ?? expense.expense_date,
    amount: Number(expense.amount || 0),
    category: expense.category,
    description: expense.description,
    reference: expense.reference || '',
    flockId: expense.flockId ?? expense.flock_id ?? null,
    flockName: expense.flockName ?? expense.flock_name ?? '',
    createdAt: timestampToIso(expense.createdAt, expense.clientCreatedAt ?? expense.created_at ?? null),
  }
}

export const expenseRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'expenses'),
        orderBy('date', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => normalizeExpense({ id: d.id, ...d.data() }))
    }

    ensureLegacySeed()
    return Storage.getExpenses().map(normalizeExpense)
  },

  async create(organizationId, expense) {
    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(collection(db, 'organizations', organizationId, 'expenses'))
      const clientCreatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(ref, {
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        reference: expense.reference || null,
        flockId: expense.flockId || null,
        flockName: expense.flockName || '',
        clientCreatedAt,
        ...writeTimestamps(true),
      }))
      return normalizeExpense({ ...expense, id: ref.id, clientCreatedAt })
    }

    ensureLegacySeed()
    const nextExpense = normalizeExpense({
      id: `exp_${Date.now()}`,
      ...expense,
      createdAt: new Date().toISOString(),
    })
    Storage.setExpenses([nextExpense, ...Storage.getExpenses()])
    return nextExpense
  },

  async remove(organizationId, expenseId) {
    if (isFirebaseConfigured && db && organizationId) {
      trackFirestoreWrite(deleteDoc(doc(db, 'organizations', organizationId, 'expenses', expenseId)))
      return
    }

    ensureLegacySeed()
    Storage.setExpenses(Storage.getExpenses().filter((expense) => expense.id !== expenseId))
  },
}
