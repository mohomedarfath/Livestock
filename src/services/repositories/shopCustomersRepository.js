import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore'
import { timestampToIso, trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

const STORAGE_KEY = 'livestocktrack_shop_customers'

function readCustomers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}

function writeCustomers(customers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

function nextId() {
  return `shop_customer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function normalizeCustomer(customer) {
  return {
    id: customer.id || nextId(),
    name: customer.name || 'Customer',
    phone: customer.phone || '',
    address: customer.address || '',
    notes: customer.notes || '',
    createdAt: timestampToIso(customer.createdAt, customer.clientCreatedAt || null),
    updatedAt: timestampToIso(customer.updatedAt, customer.clientUpdatedAt || null),
  }
}

function sortCustomers(customers) {
  return [...customers].sort((left, right) => left.name.localeCompare(right.name))
}

export const shopCustomersRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(collection(db, 'organizations', organizationId, 'shopCustomers'), orderBy('name', 'asc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((entry) => normalizeCustomer({ id: entry.id, ...entry.data() }))
    }

    return sortCustomers(readCustomers().map(normalizeCustomer))
  },

  async create(organizationId, customer) {
    const nextCustomer = normalizeCustomer({
      ...customer,
      id: customer.id || nextId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (isFirebaseConfigured && db && organizationId) {
      const ref = doc(collection(db, 'organizations', organizationId, 'shopCustomers'))
      const clientCreatedAt = new Date().toISOString()
      trackFirestoreWrite(setDoc(ref, {
        ...nextCustomer,
        id: ref.id,
        ...writeTimestamps(true),
      }))
      return normalizeCustomer({ ...nextCustomer, id: ref.id, clientCreatedAt })
    }

    writeCustomers(sortCustomers([...readCustomers(), nextCustomer]))
    return nextCustomer
  },

  async update(organizationId, customerId, updates) {
    if (isFirebaseConfigured && db && organizationId) {
      trackFirestoreWrite(updateDoc(doc(db, 'organizations', organizationId, 'shopCustomers', customerId), {
        ...updates,
        ...writeTimestamps(),
      }))
    } else {
      writeCustomers(sortCustomers(readCustomers().map((customer) =>
        customer.id === customerId ? normalizeCustomer({ ...customer, ...updates, updatedAt: new Date().toISOString() }) : customer
      )))
    }

    return this.list(organizationId)
  },

  async remove(organizationId, customerId) {
    if (isFirebaseConfigured && db && organizationId) {
      trackFirestoreWrite(deleteDoc(doc(db, 'organizations', organizationId, 'shopCustomers', customerId)))
    } else {
      writeCustomers(readCustomers().filter((customer) => customer.id !== customerId))
    }

    return this.list(organizationId)
  },
}
