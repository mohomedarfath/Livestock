import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

const STORAGE_KEY = 'livestocktrack_shop_products'

function readProducts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}

function writeProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

function nextId() {
  return `shop_product_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function normalizeShopProduct(product) {
  return {
    id: product.id || nextId(),
    name: product.name || 'Shop Product',
    category: product.category || 'egg',
    unit: product.unit || 'piece',
    costPerUnit: Math.max(0, normalizeNumber(product.costPerUnit)),
    sellingPrice: Math.max(0, normalizeNumber(product.sellingPrice)),
    stockQty: Math.max(0, normalizeNumber(product.stockQty)),
    lowStockThreshold: Math.max(0, normalizeNumber(product.lowStockThreshold)),
    sourceType: product.sourceType || 'manual',
    sourceInventoryItemId: product.sourceInventoryItemId || null,
    sourceUnit: product.sourceUnit || product.unit || 'piece',
    active: product.active !== false,
    createdAt: timestampToIso(product.createdAt, product.clientCreatedAt || null),
    updatedAt: timestampToIso(product.updatedAt, product.clientUpdatedAt || null),
  }
}

function sortProducts(products) {
  return [...products].sort((left, right) => left.name.localeCompare(right.name))
}

function cleanUpdatePayload(updates) {
  return Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined))
}

export const shopProductsRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(collection(db, 'organizations', organizationId, 'shopProducts'), orderBy('name', 'asc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((entry) => normalizeShopProduct({ id: entry.id, ...entry.data() }))
    }

    return sortProducts(readProducts().map(normalizeShopProduct))
  },

  async create(organizationId, product) {
    const nextProduct = normalizeShopProduct({
      ...product,
      id: product.id || nextId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(collection(db, 'organizations', organizationId, 'shopProducts'))
      const clientCreatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(ref, {
        ...nextProduct,
        id: ref.id,
        ...writeTimestamps(true),
      }))
      return normalizeShopProduct({ ...nextProduct, id: ref.id, clientCreatedAt })
    }

    writeProducts(sortProducts([...readProducts(), nextProduct]))
    return nextProduct
  },

  async update(organizationId, productId, updates) {
    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(db, 'organizations', organizationId, 'shopProducts', productId)
      trackFirestoreWrite(updateDoc(ref, cleanUpdatePayload({
        ...updates,
        stockQty: updates.stockQty === undefined ? undefined : Math.max(0, normalizeNumber(updates.stockQty)),
        costPerUnit: updates.costPerUnit === undefined ? undefined : Math.max(0, normalizeNumber(updates.costPerUnit)),
        sellingPrice: updates.sellingPrice === undefined ? undefined : Math.max(0, normalizeNumber(updates.sellingPrice)),
        lowStockThreshold: updates.lowStockThreshold === undefined ? undefined : Math.max(0, normalizeNumber(updates.lowStockThreshold)),
        ...writeTimestamps(),
      })))
    } else {
      writeProducts(sortProducts(readProducts().map((product) =>
        product.id === productId ? normalizeShopProduct({ ...product, ...updates, updatedAt: new Date().toISOString() }) : product
      )))
    }

    return this.list(organizationId)
  },

  async remove(organizationId, productId) {
    if (isFirebaseConfigured && db && organizationId) {
      trackFirestoreWrite(deleteDoc(doc(db, 'organizations', organizationId, 'shopProducts', productId)))
    } else {
      writeProducts(readProducts().filter((product) => product.id !== productId))
    }

    return this.list(organizationId)
  },

  async adjustStock(organizationId, productId, quantity, movement = 'add') {
    const amount = Math.max(0, normalizeNumber(quantity))
    if (amount <= 0) throw new Error('Quantity must be greater than 0.')

    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(db, 'organizations', organizationId, 'shopProducts', productId)
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref)
        if (!snap.exists()) throw new Error('Shop product not found.')

        const product = normalizeShopProduct({ id: snap.id, ...snap.data() })
        const nextStock = movement === 'remove' ? product.stockQty - amount : product.stockQty + amount
        if (nextStock < 0) throw new Error(`Not enough ${product.name.toLowerCase()} in shop stock.`)

        transaction.update(ref, {
          stockQty: nextStock,
          ...writeTimestamps(),
        })
      })
      return this.list(organizationId)
    }

    const products = readProducts()
    const product = products.find((entry) => entry.id === productId)
    if (!product) throw new Error('Shop product not found.')

    const nextStock = movement === 'remove' ? Number(product.stockQty || 0) - amount : Number(product.stockQty || 0) + amount
    if (nextStock < 0) throw new Error(`Not enough ${product.name.toLowerCase()} in shop stock.`)

    writeProducts(sortProducts(products.map((entry) =>
      entry.id === productId ? normalizeShopProduct({ ...entry, stockQty: nextStock, updatedAt: new Date().toISOString() }) : entry
    )))
    return this.list(organizationId)
  },
}
