import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrency } from '../../utils/currency.jsx'
import { useShopProducts } from '../../hooks/useShopProducts'
import { useShopOrders } from '../../hooks/useShopOrders'
import { useFarmInventory } from '../../hooks/useFarmInventory'
import { useEggInventory } from '../../hooks/useEggInventory'
import { EGG_UNITS, fromEggPieces } from '../../utils/eggInventory'

function todayKey() {
  return new Date().toISOString().split('T')[0]
}

function daysUntil(dateValue) {
  if (!dateValue) return null
  const today = new Date(todayKey())
  const expiry = new Date(dateValue)
  if (Number.isNaN(expiry.getTime())) return null
  return Math.ceil((expiry - today) / 86400000)
}

export default function ShopDashboard() {
  const navigate = useNavigate()
  const { fmt } = useCurrency()
  const { products, loading: productsLoading } = useShopProducts()
  const { orders, loading: ordersLoading } = useShopOrders()
  const { inventory: farmInventory } = useFarmInventory()
  const { inventory: eggInventory } = useEggInventory()

  const today = todayKey()
  const todayOrders = orders.filter((order) => order.date === today)
  const todaySales = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const lowStock = products.filter((product) => product.lowStockThreshold > 0 && product.stockQty <= product.lowStockThreshold)
  const paymentDue = orders.reduce((sum, order) => sum + Number(order.balanceDue || 0), 0)
  const expiringSoon = products
    .map((product) => ({ ...product, daysToExpiry: daysUntil(product.expiryDate) }))
    .filter((product) => product.daysToExpiry !== null && product.daysToExpiry <= 7)
    .sort((left, right) => left.daysToExpiry - right.daysToExpiry)

  const topProducts = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const totals = new Map()
    orders
      .filter((order) => new Date(order.date) >= thirtyDaysAgo)
      .forEach((order) => {
        order.lineItems.forEach((item) => {
          const current = totals.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 }
          current.qty += Number(item.quantity || 0)
          current.revenue += Number(item.subtotal || 0)
          totals.set(item.productId, current)
        })
      })
    return Array.from(totals.values()).sort((left, right) => right.revenue - left.revenue).slice(0, 5)
  }, [orders])

  const farmStock = useMemo(() => {
    const rows = []
    if (eggInventory && Number(eggInventory.stockPieces) > 0) {
      const unit = eggInventory.displayUnit || 'trays'
      const unitLabel = EGG_UNITS[unit]?.shortLabel || unit
      rows.push({
        id: 'eggs',
        name: 'Eggs',
        quantity: fromEggPieces(eggInventory.stockPieces, unit),
        unit: unitLabel,
        source: 'Egg inventory',
      })
    }
    ;(farmInventory?.items || [])
      .filter((item) => item.category === 'sellable' && Number(item.quantity) > 0)
      .forEach((item) => {
        rows.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          source: item.subgroup === 'meat_products' ? 'Meat' : item.subgroup === 'egg_products' ? 'Eggs' : 'Farm inventory',
        })
      })
    return rows
  }, [eggInventory, farmInventory])

  const linkedProductCount = useMemo(
    () => products.filter((product) => product.sourceType && product.sourceType !== 'manual').length,
    [products]
  )

  if (productsLoading || ordersLoading) {
    return <div className="card text-center">Loading shop workspace...</div>
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Shop Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Retail sales, stock, and customer activity.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={() => navigate('/app/shop/orders')}>New Order</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/app/shop/products')}>Products</button>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <div className="card">
          <p className="text-sm text-[var(--text-muted)]">Today Sales</p>
          <p className="text-3xl font-bold text-[var(--accent-ink)] mt-1">{fmt(todaySales)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--text-muted)]">Today Orders</p>
          <p className="text-3xl font-bold text-[var(--text)] mt-1">{todayOrders.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--text-muted)]">Products</p>
          <p className="text-3xl font-bold text-[var(--text)] mt-1">{products.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--text-muted)]">Low Stock</p>
          <p className="text-3xl font-bold mt-1" style={{ color: lowStock.length ? '#dc2626' : 'var(--text)' }}>{lowStock.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--text-muted)]">Customer Due</p>
          <p className="text-3xl font-bold mt-1" style={{ color: paymentDue ? '#dc2626' : 'var(--text)' }}>{fmt(paymentDue)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--text-muted)]">Expiring Soon</p>
          <p className="text-3xl font-bold mt-1" style={{ color: expiringSoon.length ? '#dc2626' : 'var(--text)' }}>{expiringSoon.length}</p>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Expiry Alerts</h2>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {expiringSoon.slice(0, 6).map((product) => (
              <div key={product.id} className="rounded-lg p-3" style={{ background: product.daysToExpiry < 0 ? '#fef2f2' : 'var(--surface-2)' }}>
                <p className="font-semibold text-[var(--text)]">{product.name}</p>
                <p className="text-sm text-[var(--text-muted)]">Batch: {product.batchNumber || 'No batch'}</p>
                <p className="text-sm font-semibold" style={{ color: product.daysToExpiry < 0 ? '#dc2626' : 'var(--accent-ink)' }}>
                  {product.daysToExpiry < 0 ? 'Expired' : `${product.daysToExpiry} day(s) left`} · {new Date(product.expiryDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">Available from Farm</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {linkedProductCount > 0
                ? `${linkedProductCount} shop product(s) linked to farm sources.`
                : 'Link shop products to farm sources to enable one-click transfers.'}
            </p>
          </div>
          <button type="button" className="btn-secondary text-sm" onClick={() => navigate('/app/shop/products')}>Transfer to Shop</button>
        </div>
        {farmStock.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No farm inventory available right now. Add stock in the Farm workspace or keep selling from manually-managed shop products.
          </p>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {farmStock.map((row) => (
              <div key={row.id} className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
                <p className="text-xs uppercase tracking-[.08em] text-[var(--text-dim)]">{row.source}</p>
                <p className="font-semibold text-[var(--text)] mt-1">{row.name}</p>
                <p className="text-lg font-bold text-[var(--accent-ink)] mt-1">{row.quantity} {row.unit}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">All shop products are above their alert levels.</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)' }}>
                  <div>
                    <p className="font-semibold text-[var(--text)]">{product.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">Alert at {product.lowStockThreshold} {product.unit}</p>
                  </div>
                  <p className="font-bold" style={{ color: '#dc2626' }}>{product.stockQty} {product.unit}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Top Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No shop orders in the last 30 days yet.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((product) => (
                <div key={product.name} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)' }}>
                  <div>
                    <p className="font-semibold text-[var(--text)]">{product.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{product.qty} units sold</p>
                  </div>
                  <p className="font-bold text-[var(--accent-ink)]">{fmt(product.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
