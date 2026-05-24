import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { ensureLegacySeed } from './legacyData'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function normalizeBudgetRows(rows) {
  const grouped = new Map()

  ;(rows || []).forEach((row) => {
    const month = String(row.budget_month || row.month).slice(0, 7)
    const entry = grouped.get(month) || {
      id: row.id,
      month,
      categories: {},
      createdAt: row.created_at || row.createdAt || null,
    }

    if (row.category) {
      entry.categories[row.category] = Number(row.amount || 0)
    } else if (row.categories) {
      entry.categories = { ...row.categories }
    }

    grouped.set(month, entry)
  })

  return [...grouped.values()].sort((left, right) => right.month.localeCompare(left.month))
}

export const budgetRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'budgets'),
        orderBy('month', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          month: data.month,
          categories: data.categories || {},
          createdAt: timestampToIso(data.createdAt, data.clientCreatedAt ?? null),
        }
      })
    }

    ensureLegacySeed()
    return normalizeBudgetRows(Storage.getBudgets())
  },

  async saveMonth(organizationId, month, categories) {
    if (isFirebaseConfigured && db && organizationId) {
      const clientUpdatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(doc(db, 'organizations', organizationId, 'budgets', month), {
        month,
        categories: Object.fromEntries(
          Object.entries(categories).map(([key, value]) => [key, Number(value || 0)])
        ),
        clientUpdatedAt,
        ...writeTimestamps(true),
      }, { merge: true }))
      return
    }

    ensureLegacySeed()
    const budgets = Storage.getBudgets()
    const nextBudget = {
      id: Date.now(),
      month,
      categories: Object.fromEntries(
        Object.entries(categories).map(([key, value]) => [key, Number(value || 0)])
      ),
      createdAt: new Date().toISOString(),
    }
    const updated = budgets.some((budget) => budget.month === month)
      ? budgets.map((budget) => (budget.month === month ? nextBudget : budget))
      : [...budgets, nextBudget]
    Storage.setBudgets(updated)
  },
}
