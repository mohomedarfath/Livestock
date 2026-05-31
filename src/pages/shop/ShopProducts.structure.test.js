import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(currentDir, 'ShopProducts.jsx'), 'utf8')

describe('ShopProducts page structure', () => {
  it('does not render the quick product template add section', () => {
    expect(source).not.toContain('Quick Product Templates')
    expect(source).not.toContain('SHOP_PRODUCT_TEMPLATE_GROUPS')
    expect(source).not.toContain('createFromTemplate')
    expect(source).not.toContain('createTemplateGroup')
  })
})
