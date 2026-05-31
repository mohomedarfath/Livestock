import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { collection, doc, getDocs, orderBy, query, runTransaction } from 'firebase/firestore'
import { salesRepository } from './salesRepository'
import { normalizeShopProduct } from './shopProductsRepository'
import { calculateOrderPayment, normalizePaymentMethod } from '../../shop/shopOrderPayments'
import { timestampToIso, writeTimestamps } from './firestoreOffline'

const ORDERS_KEY = 'livestocktrack_shop_orders'
const PRODUCTS_KEY = 'livestocktrack_shop_products'

function readOrders() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]')
}

function writeOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

function readProducts() {
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]')
}

function writeProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
}

function nextId() {
  return `shop_order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizeLineItem(item) {
  const quantity = Math.max(0, normalizeNumber(item.quantity))
  const unitPrice = Math.max(0, normalizeNumber(item.unitPrice))
  return {
    productId: item.productId,
    productName: item.productName || 'Product',
    quantity,
    unit: item.unit || 'piece',
    unitPrice,
    subtotal: Math.max(0, normalizeNumber(item.subtotal, quantity * unitPrice)),
  }
}

function normalizeOrder(order) {
  const lineItems = Array.isArray(order.lineItems) ? order.lineItems.map(normalizeLineItem) : []
  const total = Math.max(0, normalizeNumber(order.total, lineItems.reduce((sum, item) => sum + item.subtotal, 0)))
  const paymentMethod = normalizePaymentMethod(order.paymentMethod)
  const payment = calculateOrderPayment({ total, paidAmount: order.paidAmount ?? total, paymentMethod })
  return {
    id: order.id || nextId(),
    orderNumber: order.orderNumber || `ORD-${String(Date.now()).slice(-6)}`,
    customerId: order.customerId || null,
    customerName: order.customerName || 'Walk-in',
    date: order.date || new Date().toISOString().split('T')[0],
    lineItems,
    total,
    paymentMethod,
    paidAmount: payment.paidAmount,
    balanceDue: payment.balanceDue,
    changeDue: payment.changeDue,
    paymentStatus: payment.paymentStatus,
    notes: order.notes || '',
    createdAt: timestampToIso(order.createdAt, order.clientCreatedAt || null),
  }
}

function sortOrders(orders) {
  return [...orders].sort((left, right) => new Date(right.date) - new Date(left.date))
}

function validateOrder(order) {
  if (!order.lineItems?.length) throw new Error('Add at least one product.')
  order.lineItems.forEach((item) => {
    if (!item.productId) throw new Error('Choose a product for every line.')
    if (Number(item.quantity) <= 0) throw new Error('Order quantity must be greater than 0.')
  })
}

function buildMirrorSaleFields(order) {
  return {
    type: 'shop_order',
    shopOrderId: order.id,
    quantity: 1,
    unit: 'order',
    pricePerUnit: order.total,
    totalPrice: order.total,
    buyerName: order.customerName,
    date: order.date,
    notes: `Shop order ${order.orderNumber} (${order.paymentStatus}, paid ${order.paidAmount}, due ${order.balanceDue})`,
  }
}

async function legacyMirrorSale(organizationId, order) {
  return salesRepository.create(organizationId, buildMirrorSaleFields(order))
}

export const shopOrdersRepository = {
  async list(organizationId) {
    if (isFirebaseConfigured && db && organizationId) {
      const q = query(collection(db, 'organizations', organizationId, 'shopOrders'), orderBy('date', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((entry) => normalizeOrder({ id: entry.id, ...entry.data() }))
    }

    return sortOrders(readOrders().map(normalizeOrder))
  },

  async create(organizationId, order) {
    const nextOrder = normalizeOrder(order)
    validateOrder(nextOrder)

    if (isFirebaseConfigured && db && organizationId) {
      const orderRef = doc(collection(db, 'organizations', organizationId, 'shopOrders'))
      const saleRef = doc(collection(db, 'organizations', organizationId, 'sales'))
      const productRefs = nextOrder.lineItems.map((item) => ({
        item,
        ref: doc(db, 'organizations', organizationId, 'shopProducts', item.productId),
      }))

      await runTransaction(db, async (transaction) => {
        const products = []
        for (const entry of productRefs) {
          const snap = await transaction.get(entry.ref)
          if (!snap.exists()) throw new Error('A selected product no longer exists.')
          products.push({ ...entry, product: normalizeShopProduct({ id: snap.id, ...snap.data() }) })
        }

        products.forEach(({ item, product, ref }) => {
          const nextStock = product.stockQty - item.quantity
          if (nextStock < 0) throw new Error(`Not enough ${product.name.toLowerCase()} in shop stock.`)
          transaction.update(ref, {
            stockQty: nextStock,
            ...writeTimestamps(),
          })
        })

        transaction.set(orderRef, {
          ...nextOrder,
          id: orderRef.id,
          ...writeTimestamps(true),
        })

        transaction.set(saleRef, {
          ...buildMirrorSaleFields({ ...nextOrder, id: orderRef.id }),
          clientCreatedAt: new Date().toISOString(),
          ...writeTimestamps(true),
        })
      })

      return normalizeOrder({ ...nextOrder, id: orderRef.id, clientCreatedAt: new Date().toISOString() })
    }

    const products = readProducts().map(normalizeShopProduct)
    const productMap = new Map(products.map((product) => [product.id, product]))
    nextOrder.lineItems.forEach((item) => {
      const product = productMap.get(item.productId)
      if (!product) throw new Error('A selected product no longer exists.')
      if (product.stockQty < item.quantity) throw new Error(`Not enough ${product.name.toLowerCase()} in shop stock.`)
    })

    const nextProducts = products.map((product) => {
      const soldQty = nextOrder.lineItems
        .filter((item) => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0)
      return soldQty > 0 ? normalizeShopProduct({ ...product, stockQty: product.stockQty - soldQty }) : product
    })

    writeProducts(nextProducts)
    writeOrders(sortOrders([...readOrders(), nextOrder]))
    await legacyMirrorSale(organizationId, nextOrder)
    return nextOrder
  },
}
