import { Storage } from '../../utils/storage'
import { EGG_UNITS, fromEggPieces, normalizeEggUnit, toEggPieces } from '../../utils/eggInventory'

function nextTransactionId() {
  return `egg_tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function toStoredInventory(inventory) {
  return {
    version: 2,
    stock: fromEggPieces(inventory.stockPieces, inventory.displayUnit),
    unit: inventory.displayUnit,
    threshold: fromEggPieces(inventory.lowStockThresholdPieces, inventory.displayUnit),
    stockPieces: inventory.stockPieces,
    displayUnit: inventory.displayUnit,
    lowStockThresholdPieces: inventory.lowStockThresholdPieces,
    transactions: inventory.transactions,
  }
}

function normalizeTransaction(transaction, fallbackUnit = 'pieces') {
  const transactionUnit = normalizeEggUnit(transaction.unit || fallbackUnit)
  const quantityPieces =
    Number(transaction.quantityPieces) > 0
      ? Number(transaction.quantityPieces)
      : toEggPieces(transaction.qty ?? transaction.quantity ?? 0, transactionUnit)

  return {
    id: transaction.id || nextTransactionId(),
    type: transaction.type || 'adjustment',
    quantityPieces,
    unit: transactionUnit,
    quantity: Number(transaction.quantity ?? transaction.qty ?? fromEggPieces(quantityPieces, transactionUnit)),
    date: transaction.date || new Date().toISOString().split('T')[0],
    notes: transaction.notes || '',
    buyerName: transaction.buyerName || '',
    unitPrice: Number(transaction.unitPrice || 0),
    totalPrice: Number(transaction.totalPrice || 0),
    source: transaction.source || 'manual',
  }
}

function normalizeInventory(rawInventory) {
  const displayUnit = normalizeEggUnit(rawInventory?.displayUnit || rawInventory?.unit || 'trays')
  const legacyThreshold =
    rawInventory && rawInventory.threshold !== undefined && rawInventory.threshold !== null
      ? Number(rawInventory.threshold)
      : 10
  const stockPieces =
    Number(rawInventory?.stockPieces) >= 0
      ? Number(rawInventory.stockPieces)
      : toEggPieces(rawInventory?.stock || 0, rawInventory?.unit || displayUnit)
  const lowStockThresholdPieces =
    Number(rawInventory?.lowStockThresholdPieces) >= 0
      ? Number(rawInventory.lowStockThresholdPieces)
      : toEggPieces(legacyThreshold, rawInventory?.unit || displayUnit)
  const transactionFallbackUnit = normalizeEggUnit(rawInventory?.unit || displayUnit)
  const transactions = Array.isArray(rawInventory?.transactions)
    ? rawInventory.transactions
        .map((transaction) => normalizeTransaction(transaction, transactionFallbackUnit))
        .sort((left, right) => new Date(right.date) - new Date(left.date))
    : []

  return {
    stockPieces,
    displayUnit,
    lowStockThresholdPieces,
    stock: fromEggPieces(stockPieces, displayUnit),
    unit: displayUnit,
    threshold: fromEggPieces(lowStockThresholdPieces, displayUnit),
    transactions,
  }
}

export const eggInventoryRepository = {
  async getInventory() {
    return normalizeInventory(Storage.getEggInventory())
  },

  async updateSettings({ displayUnit, lowStockThreshold }) {
    const currentInventory = await this.getInventory()
    const nextDisplayUnit = normalizeEggUnit(displayUnit || currentInventory.displayUnit)
    const numericThreshold = Number(lowStockThreshold)
    const nextThresholdPieces =
      Number.isFinite(numericThreshold) && numericThreshold >= 0
        ? Math.round(numericThreshold * EGG_UNITS[nextDisplayUnit].multiplier)
        : currentInventory.lowStockThresholdPieces

    const nextInventory = normalizeInventory({
      ...currentInventory,
      displayUnit: nextDisplayUnit,
      lowStockThresholdPieces: nextThresholdPieces,
    })

    Storage.setEggInventory(toStoredInventory(nextInventory))
    return nextInventory
  },

  async recordMovement(movement) {
    const currentInventory = await this.getInventory()
    const quantityUnit = normalizeEggUnit(movement.unit || 'pieces')
    const quantityPieces =
      Number(movement.quantityPieces) > 0
        ? Number(movement.quantityPieces)
        : toEggPieces(movement.quantity, quantityUnit)

    if (quantityPieces <= 0) {
      throw new Error('Egg quantity must be greater than 0.')
    }

    const direction = movement.type === 'collected' || movement.type === 'adjustment' ? 1 : -1
    const nextStockPieces = currentInventory.stockPieces + direction * quantityPieces

    if (nextStockPieces < 0) {
      throw new Error(
        `Not enough egg stock. Available: ${fromEggPieces(currentInventory.stockPieces, currentInventory.displayUnit)} ${EGG_UNITS[currentInventory.displayUnit].shortLabel}.`
      )
    }

    const transaction = normalizeTransaction({
      id: movement.id,
      type: movement.type,
      quantityPieces,
      quantity: movement.quantity ?? fromEggPieces(quantityPieces, quantityUnit),
      unit: quantityUnit,
      date: movement.date,
      notes: movement.notes,
      buyerName: movement.buyerName,
      unitPrice: movement.unitPrice,
      totalPrice: movement.totalPrice,
      source: movement.source,
    })

    const nextInventory = normalizeInventory({
      ...currentInventory,
      stockPieces: nextStockPieces,
      transactions: [transaction, ...currentInventory.transactions].slice(0, 250),
    })

    Storage.setEggInventory(toStoredInventory(nextInventory))
    return nextInventory
  },
}
