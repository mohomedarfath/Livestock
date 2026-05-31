export const SHOP_PRODUCT_TEMPLATE_GROUPS = [
  {
    id: 'eggs',
    label: 'Egg products',
    description: 'Retail egg formats linked to the egg inventory conversion system.',
    templates: [
      { id: 'eggs_tray', name: 'Table Eggs - Tray', category: 'egg', unit: 'tray', sourceType: 'eggInventory', sourceUnit: 'trays', lowStockThreshold: 5 },
      { id: 'eggs_dozen', name: 'Table Eggs - Dozen', category: 'egg', unit: 'dozen', sourceType: 'eggInventory', sourceUnit: 'dozens', lowStockThreshold: 10 },
      { id: 'eggs_single', name: 'Table Eggs - Single', category: 'egg', unit: 'piece', sourceType: 'eggInventory', sourceUnit: 'pieces', lowStockThreshold: 60 },
      { id: 'hatching_eggs', name: 'Fertile / Hatching Eggs', category: 'egg', unit: 'tray', sourceType: 'farmInventory', sourceInventoryItemId: 'hatching_eggs', sourceUnit: 'trays', lowStockThreshold: 3 },
    ],
  },
  {
    id: 'meat',
    label: 'Meat products',
    description: 'Core chicken meat SKUs that can be transferred from farm inventory.',
    templates: [
      { id: 'whole_dressed_chicken', name: 'Whole Dressed Chicken', category: 'meat', unit: 'kg', sourceType: 'farmInventory', sourceInventoryItemId: 'meat', sourceUnit: 'kg', lowStockThreshold: 5 },
      { id: 'chicken_parts', name: 'Chicken Parts', category: 'meat', unit: 'kg', sourceType: 'farmInventory', sourceInventoryItemId: 'chicken_parts', sourceUnit: 'kg', lowStockThreshold: 5 },
      { id: 'chicken_breast', name: 'Chicken Breast', category: 'meat', unit: 'kg', sourceType: 'manual', lowStockThreshold: 3 },
      { id: 'chicken_legs', name: 'Chicken Thighs / Legs', category: 'meat', unit: 'kg', sourceType: 'manual', lowStockThreshold: 3 },
      { id: 'chicken_wings', name: 'Chicken Wings', category: 'meat', unit: 'kg', sourceType: 'manual', lowStockThreshold: 3 },
      { id: 'giblets', name: 'Giblets', category: 'meat', unit: 'pack', sourceType: 'manual', lowStockThreshold: 5 },
      { id: 'chicken_feet', name: 'Chicken Feet', category: 'meat', unit: 'kg', sourceType: 'manual', lowStockThreshold: 3 },
    ],
  },
  {
    id: 'live_birds',
    label: 'Live birds',
    description: 'Bird sales for customers buying livestock instead of processed meat.',
    templates: [
      { id: 'live_birds', name: 'Live Birds', category: 'processed', unit: 'bird', sourceType: 'farmInventory', sourceInventoryItemId: 'live_birds', sourceUnit: 'birds', lowStockThreshold: 10 },
      { id: 'day_old_chicks', name: 'Day-Old Chicks', category: 'processed', unit: 'bird', sourceType: 'farmInventory', sourceInventoryItemId: 'day_old_chicks', sourceUnit: 'birds', lowStockThreshold: 25 },
      { id: 'pullets', name: 'Point-of-Lay Pullets', category: 'processed', unit: 'bird', sourceType: 'manual', lowStockThreshold: 5 },
      { id: 'spent_hens', name: 'Spent Hens', category: 'meat', unit: 'bird', sourceType: 'manual', lowStockThreshold: 5 },
    ],
  },
  {
    id: 'value_added',
    label: 'Value-added products',
    description: 'Processed items usually stocked manually after production/packing.',
    templates: [
      { id: 'marinated_chicken', name: 'Ready-to-Cook Marinated Chicken', category: 'processed', unit: 'pack', sourceType: 'manual', lowStockThreshold: 5 },
      { id: 'chicken_sausages', name: 'Chicken Sausages', category: 'processed', unit: 'pack', sourceType: 'manual', lowStockThreshold: 5 },
      { id: 'nuggets_patties', name: 'Nuggets / Patties', category: 'processed', unit: 'pack', sourceType: 'manual', lowStockThreshold: 5 },
      { id: 'smoked_chicken', name: 'Smoked / Dried Chicken', category: 'processed', unit: 'pack', sourceType: 'manual', lowStockThreshold: 5 },
      { id: 'pickled_eggs', name: 'Pickled Eggs', category: 'processed', unit: 'jar', sourceType: 'manual', lowStockThreshold: 6 },
      { id: 'egg_boxes', name: 'Farm-Fresh Egg Boxes', category: 'egg', unit: 'box', sourceType: 'eggInventory', sourceUnit: 'pieces', lowStockThreshold: 8 },
    ],
  },
  {
    id: 'byproducts',
    label: 'Byproducts & farm extras',
    description: 'Secondary revenue products for the poultry farm shop.',
    templates: [
      { id: 'manure', name: 'Chicken Manure', category: 'processed', unit: 'bag', sourceType: 'farmInventory', sourceInventoryItemId: 'manure', sourceUnit: 'bags', lowStockThreshold: 10 },
      { id: 'organic_compost', name: 'Organic Compost', category: 'processed', unit: 'bag', sourceType: 'manual', lowStockThreshold: 10 },
      { id: 'feathers', name: 'Feathers', category: 'processed', unit: 'bag', sourceType: 'manual', lowStockThreshold: 2 },
      { id: 'bone_meal', name: 'Bone Meal', category: 'processed', unit: 'bag', sourceType: 'manual', lowStockThreshold: 3 },
      { id: 'blood_meal', name: 'Blood Meal', category: 'processed', unit: 'bag', sourceType: 'manual', lowStockThreshold: 3 },
    ],
  },
]

export function buildShopProductFromTemplate(template, overrides = {}) {
  return {
    name: template.name,
    category: template.category || 'egg',
    unit: template.unit || 'piece',
    costPerUnit: Number(overrides.costPerUnit ?? template.costPerUnit ?? 0),
    sellingPrice: Number(overrides.sellingPrice ?? template.sellingPrice ?? 0),
    stockQty: Number(overrides.stockQty ?? template.stockQty ?? 0),
    lowStockThreshold: Number(overrides.lowStockThreshold ?? template.lowStockThreshold ?? 0),
    sourceType: template.sourceType || 'manual',
    sourceInventoryItemId: template.sourceInventoryItemId || null,
    sourceUnit: template.sourceUnit || template.unit || 'piece',
    batchNumber: overrides.batchNumber ?? '',
    expiryDate: overrides.expiryDate ?? '',
    ...overrides,
  }
}

export function filterMissingTemplates(templates, existingProducts) {
  const existingNames = new Set((existingProducts || []).map((product) => String(product.name || '').trim().toLowerCase()))
  return templates.filter((template) => !existingNames.has(template.name.toLowerCase()))
}

export function getAllShopProductTemplates() {
  return SHOP_PRODUCT_TEMPLATE_GROUPS.flatMap((group) => group.templates.map((template) => ({ ...template, groupId: group.id })))
}
