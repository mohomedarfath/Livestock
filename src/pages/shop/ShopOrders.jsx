import { useMemo, useState } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useShopProducts } from '../../hooks/useShopProducts'
import { useShopOrders } from '../../hooks/useShopOrders'
import { useShopCustomers } from '../../hooks/useShopCustomers'

function emptyLine() {
  return { productId: '', quantity: '1' }
}

export default function ShopOrders() {
  const { fmt } = useCurrency()
  const { products, reload: reloadProducts } = useShopProducts()
  const { orders, loading, error, createOrder } = useShopOrders()
  const { customers } = useShopCustomers()
  const [customerId, setCustomerId] = useState('')
  const [walkInName, setWalkInName] = useState('')
  const [lineItems, setLineItems] = useState([emptyLine()])
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const selectedCustomer = customers.find((customer) => customer.id === customerId)
  const resolvedLines = lineItems.map((line) => {
    const product = productMap.get(line.productId)
    const quantity = Number(line.quantity) || 0
    return {
      productId: line.productId,
      productName: product?.name || '',
      quantity,
      unit: product?.unit || '',
      unitPrice: product?.sellingPrice || 0,
      subtotal: quantity * (product?.sellingPrice || 0),
      stockQty: product?.stockQty || 0,
    }
  })
  const total = resolvedLines.reduce((sum, item) => sum + item.subtotal, 0)

  function updateLine(index, updates) {
    setLineItems((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...updates } : line))
    setFormError('')
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setMessage('')

    const orderLines = resolvedLines.filter((line) => line.productId && line.quantity > 0)
    if (orderLines.length === 0) return setFormError('Add at least one product.')
    const lowStockLine = orderLines.find((line) => line.quantity > line.stockQty)
    if (lowStockLine) return setFormError(`Not enough ${lowStockLine.productName} in shop stock.`)

    try {
      await createOrder({
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || walkInName.trim() || 'Walk-in',
        date: new Date().toISOString().split('T')[0],
        lineItems: orderLines,
        total,
        paymentMethod: 'cash',
        notes,
      })
      await reloadProducts()
      setCustomerId('')
      setWalkInName('')
      setLineItems([emptyLine()])
      setNotes('')
      setMessage('Order saved and shop stock updated.')
    } catch (err) {
      setFormError(err.message || 'Failed to save order.')
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Orders & Point of Sale</h1>
        <p className="text-sm text-[var(--text-muted)]">Create customer orders and deduct shop stock.</p>
      </div>

      {(message || formError || error) && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: message ? '#f0fdf4' : '#fef2f2', color: message ? '#15803d' : '#dc2626' }}>
          {message || formError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="label-text">Customer</span>
            <select className="input-field" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Walk-in</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          {!customerId && (
            <label className="space-y-1">
              <span className="label-text">Walk-in Name</span>
              <input className="input-field" value={walkInName} onChange={(event) => setWalkInName(event.target.value)} placeholder="Optional" />
            </label>
          )}
        </div>

        <div className="space-y-2">
          {lineItems.map((line, index) => {
            const resolved = resolvedLines[index]
            return (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_120px_120px_44px] items-end rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
                <label className="space-y-1">
                  <span className="label-text">Product</span>
                  <select className="input-field" value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value })}>
                    <option value="">Choose product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name} - {product.stockQty} {product.unit}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="label-text">Qty</span>
                  <input className="input-field" type="number" min="0" step="any" value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value })} />
                </label>
                <div>
                  <span className="label-text">Subtotal</span>
                  <p className="font-bold text-[var(--text)] mt-2">{fmt(resolved.subtotal)}</p>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setLineItems((current) => current.filter((_, lineIndex) => lineIndex !== index))} disabled={lineItems.length === 1}>X</button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button type="button" className="btn-secondary" onClick={() => setLineItems((current) => [...current, emptyLine()])}>Add Line</button>
          <p className="text-xl font-bold text-[var(--text)]">Total: {fmt(total)}</p>
        </div>

        <label className="space-y-1 block">
          <span className="label-text">Notes</span>
          <input className="input-field" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
        </label>

        <button type="submit" className="btn-primary">Save Order</button>
      </form>

      <section className="card">
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">Recent Orders</h2>
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No shop orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[var(--text)]">{order.orderNumber} - {order.customerName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(order.date).toLocaleDateString('en-IN')} - {order.lineItems.length} line items</p>
                  </div>
                  <p className="font-bold text-[var(--accent-ink)]">{fmt(order.total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
