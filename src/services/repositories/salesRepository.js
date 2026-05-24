import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore'
import { ensureLegacySeed } from './legacyData'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

function readSales() {
  return JSON.parse(localStorage.getItem('clucktrack_sales') || '[]')
}

function writeSales(sales) {
  localStorage.setItem('clucktrack_sales', JSON.stringify(sales))
}

function normalizeSale(sale) {
  return {
    id: sale.id,
    type: sale.type,
    quantity: Number(sale.quantity || 0),
    unit: sale.unit,
    pricePerUnit: Number(sale.pricePerUnit || sale.price_per_unit || 0),
    totalPrice: Number(sale.totalPrice || sale.total_price || 0),
    buyerName: sale.buyerName || sale.buyer_name || '',
    date: sale.date || sale.sale_date,
    notes: sale.notes || '',
    createdAt: timestampToIso(sale.createdAt, sale.clientCreatedAt || sale.created_at || null),
  }
}

export const salesRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(
        collection(db, 'organizations', organizationId, 'sales'),
        orderBy('date', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => normalizeSale({ id: d.id, ...d.data() }))
    }

    ensureLegacySeed()
    return readSales().map(normalizeSale)
  },

  async create(organizationId, sale) {
    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(collection(db, 'organizations', organizationId, 'sales'))
      const clientCreatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(ref, {
        type: sale.type,
        quantity: sale.quantity,
        unit: sale.unit,
        pricePerUnit: sale.pricePerUnit,
        totalPrice: sale.totalPrice,
        buyerName: sale.buyerName,
        date: sale.date,
        notes: sale.notes || null,
        clientCreatedAt,
        ...writeTimestamps(true),
      }))
      return normalizeSale({ ...sale, id: ref.id, clientCreatedAt })
    }

    ensureLegacySeed()
    const nextSale = normalizeSale({
      id: `sale_${Date.now()}`,
      ...sale,
      createdAt: new Date().toISOString(),
    })
    writeSales([...readSales(), nextSale])
    return nextSale
  },
}
