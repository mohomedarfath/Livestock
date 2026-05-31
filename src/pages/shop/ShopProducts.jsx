import { useMemo, useState } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useShopProducts } from '../../hooks/useShopProducts'
import { useFarmInventory } from '../../hooks/useFarmInventory'
import { useEggInventory } from '../../hooks/useEggInventory'
import { EGG_UNITS, fromEggPieces, toEggPieces } from '../../utils/eggInventory'
import { useConfirm } from '../../components/ui'

const EMPTY_PRODUCT = {
  name: '',
  category: 'egg',
  unit: 'tray',
  costPerUnit: '',
  sellingPrice: '',
  stockQty: '0',
  lowStockThreshold: '0',
  sourceType: 'manual',
  sourceInventoryItemId: '',
  sourceUnit: '',
  batchNumber: '',
  expiryDate: '',
}

function sourceOptions(farmInventory) {
  return (farmInventory?.items || [])
    .filter((item) => item.category === 'sellable')
    .map((item) => ({ id: item.id, label: `${item.name} (${item.quantity} ${item.unit})`, unit: item.unit }))
}

export default function ShopProducts() {
  const { fmt } = useCurrency()
  const confirm = useConfirm()
  const { products, loading, error, createProduct, updateProduct, removeProduct, adjustStock } = useShopProducts()
  const { inventory: farmInventory, recordMovement } = useFarmInventory()
  const { inventory: eggInventory, recordMovement: recordEggMovement } = useEggInventory()
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [editingId, setEditingId] = useState('')
  const [transferProductId, setTransferProductId] = useState('')
  const [transferQty, setTransferQty] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const farmSources = useMemo(() => sourceOptions(farmInventory), [farmInventory])
  const editing = products.find((product) => product.id === editingId)
  const transferProduct = products.find((product) => product.id === transferProductId)

  function resetForm() {
    setForm(EMPTY_PRODUCT)
    setEditingId('')
    setFormError('')
  }

  function editProduct(product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      costPerUnit: String(product.costPerUnit),
      sellingPrice: String(product.sellingPrice),
      stockQty: String(product.stockQty),
      lowStockThreshold: String(product.lowStockThreshold),
      sourceType: product.sourceType,
      sourceInventoryItemId: product.sourceInventoryItemId || '',
      sourceUnit: product.sourceUnit || product.unit,
      batchNumber: product.batchNumber || '',
      expiryDate: product.expiryDate || '',
    })
  }


  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setMessage('')
    if (!form.name.trim()) return setFormError('Product name is required.')

    const payload = {
      ...form,
      name: form.name.trim(),
      costPerUnit: Number(form.costPerUnit) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      stockQty: Number(form.stockQty) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      sourceInventoryItemId: form.sourceType === 'farmInventory' ? form.sourceInventoryItemId : null,
      sourceUnit: form.sourceUnit || form.unit,
      batchNumber: form.batchNumber.trim(),
      expiryDate: form.expiryDate,
    }

    try {
      if (editingId) await updateProduct(editingId, payload)
      else await createProduct(payload)
      setMessage(editingId ? 'Product updated.' : 'Product created.')
      resetForm()
    } catch (err) {
      setFormError(err.message || 'Failed to save product.')
    }
  }

  async function handleTransfer(event) {
    event.preventDefault()
    setFormError('')
    setMessage('')
    const qty = Number(transferQty)
    if (!transferProduct) return setFormError('Choose a product to transfer into.')
    if (!qty || qty <= 0) return setFormError('Transfer quantity must be greater than 0.')

    try {
      if (transferProduct.sourceType === 'eggInventory') {
        const unit = transferProduct.sourceUnit || 'trays'
        const requestedPieces = toEggPieces(qty, unit)
        if (requestedPieces > (eggInventory?.stockPieces || 0)) {
          const available = fromEggPieces(eggInventory?.stockPieces || 0, unit)
          return setFormError(`Not enough egg stock. Available: ${available} ${unit}.`)
        }
        await recordEggMovement({
          type: 'transferred',
          quantity: qty,
          unit,
          date: new Date().toISOString().split('T')[0],
          source: 'shop-transfer',
          notes: `Transferred to shop product: ${transferProduct.name}`,
        })
      } else if (transferProduct.sourceType === 'farmInventory') {
        if (!transferProduct.sourceInventoryItemId) return setFormError('This product has no farm source item.')
        await recordMovement(transferProduct.sourceInventoryItemId, {
          mode: 'remove',
          quantity: qty,
          date: new Date().toISOString().split('T')[0],
          source: 'shop-transfer',
          notes: `Transferred to shop product: ${transferProduct.name}`,
        })
      } else {
        return setFormError('Set a farm or egg source before transferring stock.')
      }

      await adjustStock(transferProduct.id, qty, 'add')
      setTransferProductId('')
      setTransferQty('')
      setMessage('Stock transferred to shop.')
    } catch (err) {
      setFormError(err.message || 'Transfer failed.')
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Shop Products</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage retail products and move stock from farm inventory.</p>
      </div>

      {(message || formError || error) && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: message ? '#f0fdf4' : '#fef2f2', color: message ? '#15803d' : '#dc2626' }}>
          {message || formError || error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <form onSubmit={handleSubmit} className="card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--text)]">{editing ? 'Edit Product' : 'New Product'}</h2>
            {editing && <button type="button" className="btn-secondary text-sm" onClick={resetForm}>Cancel</button>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="label-text">Name</span>
              <input className="input-field" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Farm eggs - tray" />
            </label>
            <label className="space-y-1">
              <span className="label-text">Category</span>
              <select className="input-field" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                <option value="egg">Egg</option>
                <option value="meat">Meat</option>
                <option value="processed">Processed</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="label-text">Unit</span>
              <input className="input-field" value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="tray, kg, pack" />
            </label>
            <label className="space-y-1">
              <span className="label-text">Selling Price</span>
              <input className="input-field" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(event) => setForm((current) => ({ ...current, sellingPrice: event.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="label-text">Cost per Unit</span>
              <input className="input-field" type="number" min="0" step="0.01" value={form.costPerUnit} onChange={(event) => setForm((current) => ({ ...current, costPerUnit: event.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="label-text">Shop Stock</span>
              <input className="input-field" type="number" min="0" step="any" value={form.stockQty} onChange={(event) => setForm((current) => ({ ...current, stockQty: event.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="label-text">Low Stock Alert</span>
              <input className="input-field" type="number" min="0" step="any" value={form.lowStockThreshold} onChange={(event) => setForm((current) => ({ ...current, lowStockThreshold: event.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="label-text">Batch / Lot No.</span>
              <input className="input-field" value={form.batchNumber} onChange={(event) => setForm((current) => ({ ...current, batchNumber: event.target.value }))} placeholder="Optional" />
            </label>
            <label className="space-y-1">
              <span className="label-text">Expiry Date</span>
              <input className="input-field" type="date" value={form.expiryDate} onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="label-text">Source</span>
              <select className="input-field" value={form.sourceType} onChange={(event) => setForm((current) => ({ ...current, sourceType: event.target.value, sourceInventoryItemId: '' }))}>
                <option value="manual">Manual</option>
                <option value="eggInventory">Egg Inventory</option>
                <option value="farmInventory">Farm Inventory</option>
              </select>
            </label>
            {form.sourceType === 'farmInventory' && (
              <label className="space-y-1 md:col-span-2">
                <span className="label-text">Farm Source Item</span>
                <select className="input-field" value={form.sourceInventoryItemId} onChange={(event) => {
                  const item = farmSources.find((entry) => entry.id === event.target.value)
                  setForm((current) => ({ ...current, sourceInventoryItemId: event.target.value, sourceUnit: item?.unit || current.sourceUnit }))
                }}>
                  <option value="">Choose source item</option>
                  {farmSources.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            )}
            {form.sourceType === 'eggInventory' && (
              <label className="space-y-1 md:col-span-2">
                <span className="label-text">Egg Source Unit</span>
                <select className="input-field" value={form.sourceUnit || 'trays'} onChange={(event) => setForm((current) => ({ ...current, sourceUnit: event.target.value }))}>
                  {Object.keys(EGG_UNITS).map((unit) => <option key={unit} value={unit}>{EGG_UNITS[unit].label}</option>)}
                </select>
              </label>
            )}
          </div>
          <button type="submit" className="btn-primary">{editing ? 'Save Product' : 'Create Product'}</button>
        </form>

        <form onSubmit={handleTransfer} className="card space-y-3">
          <h2 className="text-lg font-bold text-[var(--text)]">Transfer from Farm Stock</h2>
          <label className="space-y-1">
            <span className="label-text">Product</span>
            <select className="input-field" value={transferProductId} onChange={(event) => setTransferProductId(event.target.value)}>
              <option value="">Choose product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>
          {transferProduct?.sourceType === 'eggInventory' && eggInventory && (
            <p className="text-sm text-[var(--text-muted)]">
              Egg stock available: {fromEggPieces(eggInventory.stockPieces, transferProduct.sourceUnit || 'trays')} {transferProduct.sourceUnit || 'trays'}
            </p>
          )}
          <label className="space-y-1">
            <span className="label-text">Quantity</span>
            <input className="input-field" type="number" min="0" step="any" value={transferQty} onChange={(event) => setTransferQty(event.target.value)} />
          </label>
          <button type="submit" className="btn-primary">Transfer Stock</button>
        </form>
      </div>

      <section className="card">
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">Catalog</h2>
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No shop products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Stock</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Batch / Expiry</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 pr-3 font-semibold text-[var(--text)]">{product.name}</td>
                    <td className="py-3 pr-3">{product.stockQty} {product.unit}</td>
                    <td className="py-3 pr-3">{fmt(product.sellingPrice)}</td>
                    <td className="py-3 pr-3 text-xs text-[var(--text-muted)]">
                      <span className="block">{product.batchNumber || 'No batch'}</span>
                      <span className={product.expiryDate && new Date(product.expiryDate) < new Date() ? 'text-red-600 font-semibold' : ''}>
                        {product.expiryDate ? `Exp: ${new Date(product.expiryDate).toLocaleDateString('en-IN')}` : 'No expiry'}
                      </span>
                    </td>
                    <td className="py-3 pr-3">{product.sourceType}</td>
                    <td className="py-3 pr-3 text-right">
                      <button type="button" className="btn-secondary text-xs mr-2" onClick={() => editProduct(product)}>Edit</button>
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete shop product?',
                            description: `${product.name} will be removed from the catalog. Existing orders that reference it will keep their saved details.`,
                            confirmLabel: 'Delete',
                            destructive: true,
                          })
                          if (ok) await removeProduct(product.id)
                        }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
