import { db } from '../../lib/firebase'
import { isFirebaseConfigured } from '../../lib/env'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Storage } from '../../utils/storage'
import { trackFirestoreWrite, writeTimestamps } from './firestoreOffline'

const SYSTEM_DEFAULT_ITEMS = [
  { id: 'feed', name: 'Feed', category: 'supply', subgroup: 'nutrition', unit: 'kg', quantity: 0, threshold: 50, notes: 'Main feed stock for birds and chicks.' },
  { id: 'medicine', name: 'Medicine', category: 'supply', subgroup: 'health', unit: 'packs', quantity: 0, threshold: 5, notes: 'Vaccines, antibiotics, and treatment stock.' },
  { id: 'water', name: 'Water Reserve', category: 'supply', subgroup: 'utilities', unit: 'L', quantity: 1500, threshold: 400, notes: 'Water tank or reserve available for the farm.' },
  { id: 'supplements', name: 'Supplements', category: 'supply', subgroup: 'nutrition', unit: 'packs', quantity: 12, threshold: 4, notes: 'Vitamins, electrolytes, and mineral supplements.' },
  { id: 'bedding', name: 'Bedding / Litter', category: 'supply', subgroup: 'materials', unit: 'bags', quantity: 18, threshold: 5, notes: 'Wood shavings, litter, or bedding material.' },
  { id: 'live_birds',     name: 'Live Birds',              category: 'sellable', subgroup: 'live_birds',    unit: 'birds', quantity: 0, threshold: 0, notes: 'Adult birds available for sale.' },
  { id: 'day_old_chicks', name: 'Day-Old Chicks',          category: 'sellable', subgroup: 'live_birds',    unit: 'birds', quantity: 0, threshold: 0, notes: 'DOCs ready for customers.' },
  { id: 'meat',           name: 'Whole Dressed Chicken',   category: 'sellable', subgroup: 'meat_products', unit: 'kg',    quantity: 0, threshold: 0, notes: 'Whole processed chicken ready for sale.' },
  { id: 'chicken_parts',  name: 'Chicken Parts',           category: 'sellable', subgroup: 'meat_products', unit: 'kg',    quantity: 0, threshold: 0, notes: 'Breast, thighs, wings, and drumsticks.' },
  { id: 'hatching_eggs',  name: 'Fertile / Hatching Eggs', category: 'sellable', subgroup: 'egg_products',  unit: 'trays', quantity: 0, threshold: 0, notes: 'Fertile eggs for incubation or sale.' },
  { id: 'manure',         name: 'Chicken Manure',          category: 'sellable', subgroup: 'byproducts',    unit: 'bags',  quantity: 0, threshold: 0, notes: 'Manure / compost ready for sale.' },
]

const DEFAULT_ITEM_IDS = new Set(SYSTEM_DEFAULT_ITEMS.map((item) => item.id))

const REMOVED_DEFAULT_IDS = new Set([
  'giblets', 'chicken_feet', 'chicken_neck', 'processed_chicken',
  'pullets', 'broiler_chicks', 'breeding_roosters', 'spent_hens',
  'chicks', 'specialty_eggs', 'feathers', 'chicken_fat', 'bone_meal',
  'blood_meal', 'organic_compost', 'farm_mixed_feed', 'incubation_services',
  'marinated_chicken', 'smoked_chicken', 'pickled_eggs', 'branded_egg_boxes',
  'vaccine_fertile_eggs', 'show_birds', 'heritage_breed_chickens',
])

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function inferSubgroup(item) {
  if (item.subgroup) return item.subgroup
  const subgroupById = {
    feed: 'nutrition', supplements: 'nutrition', medicine: 'health',
    water: 'utilities', bedding: 'materials', live_birds: 'live_birds',
    day_old_chicks: 'live_birds', meat: 'meat_products', chicken_parts: 'meat_products',
    hatching_eggs: 'egg_products', manure: 'byproducts',
  }
  return subgroupById[item.id] || (item.category === 'sellable' ? 'other_sellable' : 'other_supply')
}

function normalizeItem(item) {
  return {
    id: item.id || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: item.name || 'Inventory Item',
    category: item.category === 'sellable' ? 'sellable' : 'supply',
    subgroup: inferSubgroup(item),
    unit: item.unit || 'units',
    quantity: Math.max(0, normalizeNumber(item.quantity)),
    threshold: Math.max(0, normalizeNumber(item.threshold)),
    notes: item.notes || '',
    system: DEFAULT_ITEM_IDS.has(item.id),
  }
}

function normalizeMovement(movement) {
  return {
    id: movement.id || `move_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    itemId: movement.itemId,
    itemName: movement.itemName || 'Inventory Item',
    mode: movement.mode || 'set',
    quantity: Math.max(0, normalizeNumber(movement.quantity)),
    unit: movement.unit || 'units',
    date: movement.date || new Date().toISOString().split('T')[0],
    notes: movement.notes || '',
    source: movement.source || 'manual',
  }
}

function normalizeState(rawState) {
  const items = Array.isArray(rawState?.items)
    ? rawState.items.filter((item) => !REMOVED_DEFAULT_IDS.has(item.id)).map(normalizeItem)
    : []
  const itemIds = new Set(items.map((item) => item.id))
  const itemsWithDefaults = [
    ...items,
    ...SYSTEM_DEFAULT_ITEMS.filter((item) => !itemIds.has(item.id)).map(normalizeItem),
  ]
  const movements = Array.isArray(rawState?.movements) ? rawState.movements.map(normalizeMovement) : []

  return {
    version: 1,
    items: itemsWithDefaults,
    movements: movements.sort((left, right) => new Date(right.date) - new Date(left.date)),
  }
}

async function loadState(organizationId) {
  if (isFirebaseConfigured && db && organizationId) {
    const snap = await getDoc(doc(db, 'organizations', organizationId, 'farmInventory', 'state'))
    return normalizeState(snap.exists() ? snap.data() : {})
  }
  return normalizeState(Storage.getFarmInventory())
}

async function saveState(organizationId, state) {
  if (isFirebaseConfigured && db && organizationId) {
    trackFirestoreWrite(setDoc(doc(db, 'organizations', organizationId, 'farmInventory', 'state'), {
      ...state,
      ...writeTimestamps(),
    }, { merge: true }))
  } else {
    Storage.setFarmInventory(state)
  }
  return state
}

export const farmInventoryRepository = {
  async getInventory(organizationId) {
    return loadState(organizationId)
  },

  async createItem(organizationId, item) {
    const state = await loadState(organizationId)
    const nextItem = normalizeItem(item)
    const nextState = normalizeState({ ...state, items: [...state.items, nextItem] })
    return saveState(organizationId, nextState)
  },

  async updateItem(organizationId, itemId, updates) {
    const state = await loadState(organizationId)
    const nextState = normalizeState({
      ...state,
      items: state.items.map((item) =>
        item.id === itemId ? normalizeItem({ ...item, ...updates }) : item
      ),
    })

    await saveState(organizationId, nextState)

    if (!isFirebaseConfigured && itemId === 'feed') {
      const currentFeedStock = Storage.getFeedStock()
      const nextFeed = nextState.items.find((entry) => entry.id === 'feed')
      Storage.setFeedStock({
        ...currentFeedStock,
        kgOnHand: nextFeed?.quantity ?? currentFeedStock.kgOnHand,
        threshold: nextFeed?.threshold ?? currentFeedStock.threshold,
        lastUpdated: new Date().toISOString(),
      })
    }

    return nextState
  },

  async recordMovement(organizationId, itemId, movement) {
    const state = await loadState(organizationId)
    const item = state.items.find((entry) => entry.id === itemId)

    if (!item) throw new Error('Inventory item not found.')

    const quantity = Math.max(0, normalizeNumber(movement.quantity))
    if (quantity <= 0 && movement.mode !== 'set') throw new Error('Quantity must be greater than 0.')

    let nextQuantity = item.quantity
    if (movement.mode === 'add') nextQuantity = item.quantity + quantity
    if (movement.mode === 'remove') nextQuantity = item.quantity - quantity
    if (movement.mode === 'set') nextQuantity = quantity

    if (nextQuantity < 0) throw new Error(`Not enough ${item.name.toLowerCase()} in stock.`)

    const nextState = normalizeState({
      ...state,
      items: state.items.map((entry) =>
        entry.id === itemId ? { ...entry, quantity: nextQuantity } : entry
      ),
      movements: [
        normalizeMovement({
          itemId,
          itemName: item.name,
          mode: movement.mode,
          quantity,
          unit: item.unit,
          date: movement.date,
          notes: movement.notes,
          source: movement.source,
        }),
        ...state.movements,
      ].slice(0, 250),
    })

    await saveState(organizationId, nextState)

    if (!isFirebaseConfigured && itemId === 'feed') {
      const currentFeedStock = Storage.getFeedStock()
      Storage.setFeedStock({
        ...currentFeedStock,
        kgOnHand: nextQuantity,
        threshold: nextState.items.find((entry) => entry.id === 'feed')?.threshold || currentFeedStock.threshold,
        lastUpdated: new Date().toISOString(),
      })
    }

    return nextState
  },

  async applySale(organizationId, itemId, sale) {
    return this.recordMovement(organizationId, itemId, {
      mode: 'remove',
      quantity: sale.quantity,
      date: sale.date,
      notes: sale.notes || `Sale to ${sale.buyerName || 'customer'}`,
      source: 'sales-log',
    })
  },
}
