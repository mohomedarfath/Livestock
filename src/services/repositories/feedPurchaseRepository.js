import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { ensureLegacySeed } from './legacyData'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function normalizePurchase(purchase) {
  return {
    id: purchase.id,
    type: purchase.type ?? purchase.feed_type ?? '',
    kg: Number(purchase.kg ?? purchase.quantity_kg ?? 0),
    pricePerKg: Number(purchase.pricePerKg ?? purchase.price_per_kg ?? 0),
    totalPrice: Number(purchase.totalPrice ?? purchase.total_price ?? 0),
    date: purchase.date ?? purchase.purchase_date,
    notes: purchase.notes || '',
    createdAt: timestampToIso(purchase.createdAt, purchase.clientCreatedAt ?? purchase.created_at ?? null),
  }
}

export const feedPurchaseRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'feedPurchases'),
        orderBy('date', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => normalizePurchase({ id: d.id, ...d.data() }))
    }

    ensureLegacySeed()
    return Storage.getFeedLog().map(normalizePurchase)
  },

  async create(organizationId, purchase) {
    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(collection(db, 'organizations', organizationId, 'feedPurchases'))
      const clientCreatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(ref, {
        type: purchase.type,
        kg: Number(purchase.kg || 0),
        pricePerKg: Number(purchase.pricePerKg || 0),
        totalPrice: Number(purchase.totalPrice || 0),
        date: purchase.date,
        notes: purchase.notes || null,
        clientCreatedAt,
        ...writeTimestamps(true),
      }))
      return normalizePurchase({ ...purchase, id: ref.id, clientCreatedAt })
    }

    ensureLegacySeed()
    const nextPurchase = normalizePurchase({
      id: Date.now(),
      ...purchase,
      createdAt: new Date().toISOString(),
    })
    Storage.setFeedLog([...Storage.getFeedLog(), nextPurchase])
    return nextPurchase
  },
}
