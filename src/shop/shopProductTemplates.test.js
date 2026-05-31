import { describe, expect, it } from 'vitest'
import {
  SHOP_PRODUCT_TEMPLATE_GROUPS,
  buildShopProductFromTemplate,
  filterMissingTemplates,
} from './shopProductTemplates'

describe('shop product templates', () => {
  it('groups starter templates for eggs, meat, live birds, value added, and byproducts', () => {
    expect(SHOP_PRODUCT_TEMPLATE_GROUPS.map((group) => group.id)).toEqual([
      'eggs',
      'meat',
      'live_birds',
      'value_added',
      'byproducts',
    ])
  })

  it('builds egg templates linked to egg inventory with numeric defaults', () => {
    const template = SHOP_PRODUCT_TEMPLATE_GROUPS[0].templates.find((entry) => entry.id === 'eggs_tray')

    expect(buildShopProductFromTemplate(template)).toMatchObject({
      name: 'Table Eggs - Tray',
      category: 'egg',
      unit: 'tray',
      sourceType: 'eggInventory',
      sourceUnit: 'trays',
      stockQty: 0,
      lowStockThreshold: 5,
      sellingPrice: 0,
      costPerUnit: 0,
    })
  })

  it('builds meat templates linked to matching farm inventory source items', () => {
    const template = SHOP_PRODUCT_TEMPLATE_GROUPS[1].templates.find((entry) => entry.id === 'whole_dressed_chicken')

    expect(buildShopProductFromTemplate(template)).toMatchObject({
      name: 'Whole Dressed Chicken',
      category: 'meat',
      unit: 'kg',
      sourceType: 'farmInventory',
      sourceInventoryItemId: 'meat',
      sourceUnit: 'kg',
      lowStockThreshold: 5,
    })
  })

  it('omits templates whose product names already exist case-insensitively', () => {
    const templates = SHOP_PRODUCT_TEMPLATE_GROUPS[0].templates
    const missing = filterMissingTemplates(templates, [
      { name: 'table eggs - tray' },
      { name: 'Custom Product' },
    ])

    expect(missing.map((entry) => entry.id)).not.toContain('eggs_tray')
    expect(missing.map((entry) => entry.id)).toContain('eggs_dozen')
  })
})
