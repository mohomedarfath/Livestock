import { useEffect, useMemo, useRef, useState } from 'react'
import { useFarmInventory } from '../hooks/useFarmInventory'
import { useEggInventory } from '../hooks/useEggInventory'
import { fromEggPieces, toEggPieces } from '../utils/eggInventory'
import { iconForItem } from '../utils/itemIcons'
import { useAnimalType } from '../animal/AnimalTypeContext'
import StatCard from '../components/StatCard'
import StatusDot from '../components/StatusDot'
import { Tabs } from '../components/ui'

const POULTRY_ONLY_ITEM_IDS = new Set(['eggs', 'hatching_eggs', 'chicken_parts'])

const COW_ITEM_PRESENTATION = {
  feed: { name: 'Cattle Feed / Concentrate', notes: 'Main feed stock for cows and calves.' },
  medicine: { name: 'Cattle Medicine', notes: 'Treatments, vaccines, and cattle health stock.' },
  supplements: { name: 'Mineral Mix / Supplements', notes: 'Mineral, salt, vitamin, and electrolyte stock.' },
  bedding: { name: 'Bedding / Straw', notes: 'Straw, bedding, or resting area material.' },
  live_birds: { name: 'Live Cattle', subgroup: 'live_cattle', unit: 'cattle', notes: 'Cows, bulls, and heifers available for sale.' },
  day_old_chicks: { name: 'Calves', subgroup: 'live_cattle', unit: 'calves', notes: 'Calves available for sale or transfer.' },
  meat: { name: 'Beef / Cattle Meat', notes: 'Processed cattle meat ready for sale.' },
  manure: { name: 'Cattle Manure', notes: 'Cattle manure or compost stock ready for sale.' },
}

const GOAT_ITEM_PRESENTATION = {
  feed: { name: 'Goat Feed / Concentrate', notes: 'Main feed stock for goats and kids.' },
  medicine: { name: 'Goat Medicine', notes: 'Treatments, vaccines, and goat health stock.' },
  supplements: { name: 'Mineral Mix / Supplements', notes: 'Mineral, salt, vitamin, and electrolyte stock.' },
  bedding: { name: 'Bedding / Straw', notes: 'Straw, bedding, or resting area material.' },
  live_birds: { name: 'Live Goats', subgroup: 'live_goats', unit: 'goats', notes: 'Goats available for sale.' },
  day_old_chicks: { name: 'Kids', subgroup: 'live_goats', unit: 'kids', notes: 'Young goats available for sale or transfer.' },
  meat: { name: 'Goat Meat', notes: 'Processed goat meat ready for sale.' },
  manure: { name: 'Goat Manure', notes: 'Goat manure or compost stock ready for sale.' },
}

const INVENTORY_COPY = {
  cow: {
    title: 'Cattle Inventory',
    description: 'Manage cattle feed, supplies, live cattle, calves, beef, and manure stock.',
    totalLabel: 'Cattle Items',
    totalIcon: '🐄',
    emptyIcon: '🐄',
    addProductLabel: 'Add Cattle Product',
    addSupplyLabel: 'Add Cattle Supply',
    productTitle: 'Cattle Product',
    supplyTitle: 'Cattle Supply',
    productPlaceholder: 'e.g. Raw Milk',
    supplyPlaceholder: 'e.g. Mineral Mix',
    searchPlaceholder: 'Search cattle stock...',
    noItemsTitle: 'No cattle inventory found',
  },
  goat: {
    title: 'Goat Inventory',
    description: 'Manage goat feed, supplies, live goats, kids, meat, and manure stock.',
    totalLabel: 'Goat Items',
    totalIcon: '🐐',
    emptyIcon: '🐐',
    addProductLabel: 'Add Goat Product',
    addSupplyLabel: 'Add Goat Supply',
    productTitle: 'Goat Product',
    supplyTitle: 'Goat Supply',
    productPlaceholder: 'e.g. Goat Milk',
    supplyPlaceholder: 'e.g. Mineral Mix',
    searchPlaceholder: 'Search goat stock...',
    noItemsTitle: 'No goat inventory found',
  },
  default: {
    title: 'Farm Inventory',
    description: 'Manage supplies, sellable products, and stock movements.',
    totalLabel: 'Total Items',
    totalIcon: '📦',
    emptyIcon: '📭',
    addProductLabel: 'Add Product',
    addSupplyLabel: 'Add Supply',
    productTitle: 'Product',
    supplyTitle: 'Supply',
    productPlaceholder: 'e.g. Dressed Chicken',
    supplyPlaceholder: 'e.g. Corn Feed',
    searchPlaceholder: 'Search items...',
    noItemsTitle: 'No items found',
  },
}

function inventoryCopyFor(animalType) {
  return INVENTORY_COPY[animalType] || INVENTORY_COPY.default
}

function itemPresentationFor(animalType) {
  if (animalType === 'cow') return COW_ITEM_PRESENTATION
  if (animalType === 'goat') return GOAT_ITEM_PRESENTATION
  return null
}

function shouldShowInventoryItem(item, animalType) {
  if (!item) return false
  if ((animalType === 'cow' || animalType === 'goat') && POULTRY_ONLY_ITEM_IDS.has(item.id)) return false
  return true
}

function presentInventoryItem(item, animalType) {
  const presentation = itemPresentationFor(animalType)
  const override = presentation?.[item.id]
  return override ? { ...item, ...override, originalName: item.name } : item
}

function buildEggPayload(mode, qty, eggInv, date, notes) {
  const unit = eggInv?.displayUnit || 'trays'
  if (mode === 'set') {
    const diff = toEggPieces(qty, unit) - (eggInv?.stockPieces || 0)
    if (diff === 0) return null
    return { type: diff > 0 ? 'adjustment' : 'broken', quantity: fromEggPieces(Math.abs(diff), unit), unit, date, notes: notes || 'Stock correction' }
  }
  return { type: mode === 'add' ? 'adjustment' : 'broken', quantity: qty, unit, date, notes }
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const isLow = (item) => item.threshold > 0 && item.quantity <= item.threshold
const isEmpty = (item) => (item.quantity ?? 0) === 0

function statusOf(item) {
  if (!item) return 'ok'
  if (isEmpty(item)) return 'empty'
  if (isLow(item)) return 'low'
  return 'ok'
}

function PencilIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export default function FarmInventory({ onNavigate }) {
  const { inventory, loading, error, createItem, updateItem, recordMovement } = useFarmInventory()
  const { inventory: eggInv, recordMovement: recordEggMovement } = useEggInventory()
  const { selectedAnimalType } = useAnimalType()
  const inventoryCopy = inventoryCopyFor(selectedAnimalType)
  const showEggInventory = selectedAnimalType === 'poultry' || selectedAnimalType === 'all'

  const [tab, setTab]           = useState('items')
  const [selectedId, setSelectedId] = useState('')
  const [mode, setMode]         = useState('add')
  const [qty, setQty]           = useState('')
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes]       = useState('')
  const [formError, setFormError] = useState('')
  const [flash, setFlash]       = useState('')
  const [threshold, setThreshold] = useState('')
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [newItem, setNewItem]   = useState({ name: '', unit: '', category: 'supply', quantity: '', threshold: '' })
  const addMenuRef = useRef(null)

  useEffect(() => {
    if (!addMenuOpen) return
    function onClick(e) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [addMenuOpen])

  const eggItem = useMemo(() => showEggInventory && eggInv ? {
    id: 'eggs', name: 'Table Eggs', category: 'sellable',
    unit: eggInv.displayUnit, quantity: eggInv.stock, threshold: eggInv.threshold, system: true,
  } : null, [eggInv, showEggInventory])

  const allItems = useMemo(() => {
    const farm = (inventory?.items || [])
      .filter((item) => shouldShowInventoryItem(item, selectedAnimalType))
      .map((item) => presentInventoryItem(item, selectedAnimalType))
    return eggItem ? [eggItem, ...farm] : farm
  }, [eggItem, inventory, selectedAnimalType])

  const itemById = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems])

  const selected = useMemo(() => allItems.find(i => i.id === selectedId) || null, [allItems, selectedId])

  useEffect(() => {
    if (selectedId && !selected) setSelectedId('')
  }, [selected, selectedId])

  useEffect(() => {
    if (selected) setThreshold(String(selected.threshold ?? 0))
    else setThreshold('')
  }, [selected?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const total  = allItems.length
    const supply = allItems.filter(i => i.category === 'supply').length
    const product = allItems.filter(i => i.category === 'sellable').length
    const low    = allItems.filter(isLow).length
    const empty  = allItems.filter(isEmpty).length
    return { total, supply, product, low, empty }
  }, [allItems])

  const tableItems = useMemo(() => {
    let base = allItems
    if (catFilter === 'supply')   base = base.filter(i => i.category === 'supply')
    if (catFilter === 'sellable') base = base.filter(i => i.category === 'sellable')
    if (catFilter === 'low')      base = allItems.filter(isLow)
    if (search.trim()) {
      const q = search.toLowerCase()
      base = base.filter(i => i.name.toLowerCase().includes(q))
    }
    return base
  }, [allItems, search, catFilter])

  const recentMoves = useMemo(() => {
    const farm = (inventory?.movements || [])
      .filter(m => shouldShowInventoryItem({ id: m.itemId }, selectedAnimalType))
      .map(m => {
        const item = itemById.get(m.itemId)
        const fallback = presentInventoryItem({ id: m.itemId, name: m.itemName, unit: m.unit }, selectedAnimalType)
        return {
          id: m.id,
          label: item?.name || fallback.name,
          qty: m.quantity,
          unit: item?.unit || fallback.unit || m.unit,
          date: m.date,
          mode: m.mode,
        }
      })
    const eggs = showEggInventory && eggInv ? (eggInv.transactions || []).map(t => ({
      id: t.id, label: 'Table Eggs',
      qty: fromEggPieces(t.quantityPieces, eggInv.displayUnit),
      unit: eggInv.displayUnit, date: t.date,
      mode: (t.type === 'sold' || t.type === 'broken') ? 'remove' : 'add',
    })) : []
    return [...farm, ...eggs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20)
  }, [eggInv, inventory, itemById, selectedAnimalType, showEggInventory])

  function showFlash(msg) { setFlash(msg); setTimeout(() => setFlash(''), 2500) }

  function openAddForm(category) {
    setNewItem({ name: '', unit: '', category, quantity: '', threshold: '' })
    setShowAddForm(true)
    setAddMenuOpen(false)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setFormError('')
    if (!selectedId) return setFormError('Select an item.')

    const amount   = Number(qty)
    const hasQty   = qty.trim() !== ''
    const newLimit = Number(threshold)
    const limitChanged = selectedId !== 'eggs' && !isNaN(newLimit) && newLimit !== (selected?.threshold ?? 0)

    if (!hasQty && !limitChanged) return setFormError('Enter a quantity or change the alert limit.')
    if (hasQty && mode !== 'set' && amount <= 0) return setFormError('Enter a quantity greater than 0.')

    try {
      if (selectedId === 'eggs') {
        if (hasQty) {
          const payload = buildEggPayload(mode, amount, eggInv, date, notes.trim())
          if (payload) await recordEggMovement({ ...payload, source: 'inventory-page' })
        }
      } else {
        if (limitChanged) await updateItem(selectedId, { threshold: Math.max(0, newLimit) })
        if (hasQty) await recordMovement(selectedId, { mode, quantity: amount, date, notes: notes.trim(), source: 'inventory-page' })
      }
      setQty('')
      setNotes('')
      showFlash('Saved!')
    } catch (err) { setFormError(err.message || 'Failed.') }
  }

  async function handleAddItem(e) {
    e.preventDefault()
    setFormError('')
    try {
      await createItem({
        name: newItem.name.trim(), unit: newItem.unit.trim(), category: newItem.category,
        quantity: Number(newItem.quantity) || 0, threshold: Number(newItem.threshold) || 0,
      })
      setNewItem({ name: '', unit: '', category: 'supply', quantity: '', threshold: '' })
      setShowAddForm(false)
      showFlash('Item added!')
    } catch (err) { setFormError(err.message || 'Failed.') }
  }

  function goUpdate(id) {
    setSelectedId(id)
    setTab('update')
  }

  if (loading && !inventory) {
    return <div className="w-full max-w-6xl mx-auto px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>
  }

  const showTypeColumn = catFilter === 'all'

  const filterChips = [
    { key: 'all',      label: 'All',      count: counts.total },
    { key: 'supply',   label: 'Supplies', count: counts.supply },
    { key: 'sellable', label: 'Products', count: counts.product },
    { key: 'low',      label: 'Low',      count: counts.low, warn: counts.low > 0 },
  ]

  return (
    <div className="w-full max-w-6xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Stat cards */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        <StatCard label={inventoryCopy.totalLabel} value={counts.total} icon={inventoryCopy.totalIcon} />
        <StatCard
          label="Low Stock"
          value={counts.low}
          icon="⚠"
          tone={counts.low > 0 ? 'amber' : 'neutral'}
          hint={counts.low > 0 ? 'Restock soon' : 'All stock healthy'}
        />
        <StatCard
          label="Empty"
          value={counts.empty}
          icon="⛔"
          tone={counts.empty > 0 ? 'red' : 'neutral'}
          hint={counts.empty > 0 ? 'Out of stock' : 'Everything on hand'}
        />
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          {inventoryCopy.description}
        </p>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {onNavigate && showEggInventory && (
            <button onClick={() => onNavigate('sales')} className="btn-secondary" style={{ fontSize: '12px', padding: '5px 10px', minHeight: 'auto' }}>Sales</button>
          )}
          <div ref={addMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { if (showAddForm) setShowAddForm(false); else setAddMenuOpen(v => !v) }}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '5px 12px', minHeight: 'auto' }}
            >
              {showAddForm ? 'Cancel' : '+ Add ▾'}
            </button>
            {addMenuOpen && !showAddForm && (
              <div
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 40,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '10px', boxShadow: '0 4px 24px var(--shadow-md, rgba(0,0,0,.08))',
                  padding: '4px', minWidth: '180px',
                }}
              >
                <button
                  onClick={() => openAddForm('sellable')}
                  style={{ ...MENU_ITEM, background: 'transparent' }}
                >
                  <span>{inventoryCopy.totalIcon}</span><span>{inventoryCopy.addProductLabel}</span>
                </button>
                <button
                  onClick={() => openAddForm('supply')}
                  style={{ ...MENU_ITEM, background: 'transparent' }}
                >
                  <span>🌾</span><span>{inventoryCopy.addSupplyLabel}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low stock banner */}
      {counts.low > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>⚠ {counts.low} item{counts.low > 1 ? 's' : ''} running low</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#b91c1c' }}>
              {allItems.filter(isLow).slice(0, 3).map(i => i.name).join(', ')}{counts.low > 3 ? ` +${counts.low - 3} more` : ''}
            </p>
          </div>
          <button onClick={() => { setCatFilter('low'); setTab('items') }} style={{ flexShrink: 0, fontSize: '12px', fontWeight: 600, color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
            View →
          </button>
        </div>
      )}

      {(error || formError) && (
        <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>{formError || error}</div>
      )}
      {flash && (
        <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#f0fdf4', color: '#15803d' }}>{flash}</div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <div className="card" style={{ padding: '14px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
            New {newItem.category === 'sellable' ? inventoryCopy.productTitle : inventoryCopy.supplyTitle}
          </p>
          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
              <div>
                <label style={L}>Name</label>
                <input
                  className="input-field"
                  required
                  value={newItem.name}
                  onChange={e => setNewItem(f => ({ ...f, name: e.target.value }))}
                  placeholder={newItem.category === 'sellable' ? inventoryCopy.productPlaceholder : inventoryCopy.supplyPlaceholder}
                />
              </div>
              <div>
                <label style={L}>Unit</label>
                <input className="input-field" required value={newItem.unit} onChange={e => setNewItem(f => ({ ...f, unit: e.target.value }))} placeholder="kg, bags…" />
              </div>
              <div>
                <label style={L}>Type</label>
                <select className="input-field" value={newItem.category} onChange={e => setNewItem(f => ({ ...f, category: e.target.value }))}>
                  <option value="supply">Supply</option>
                  <option value="sellable">Product</option>
                </select>
              </div>
              <div>
                <label style={L}>Start Qty</label>
                <input className="input-field" type="number" min="0" value={newItem.quantity} onChange={e => setNewItem(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label style={L}>Alert below</label>
                <input className="input-field" type="number" min="0" value={newItem.threshold} onChange={e => setNewItem(f => ({ ...f, threshold: e.target.value }))} placeholder="0 = off" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '5px 14px', minHeight: 'auto' }}>Save</button>
          </form>
        </div>
      )}

      <Tabs
        ariaLabel={`${inventoryCopy.title} sections`}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'items', label: 'Items' },
          { value: 'update', label: 'Update Stock' },
          { value: 'activity', label: `Activity${recentMoves.length ? ` (${recentMoves.length})` : ''}` },
        ]}
      />

      {/* ── Tab: Items ── */}
      {tab === 'items' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              className="input-field" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={inventoryCopy.searchPlaceholder} style={{ flex: 1, padding: '5px 10px', fontSize: '13px', minHeight: 'auto' }}
            />
          </div>
          {/* Category pills */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {filterChips.map(c => {
              const active = catFilter === c.key
              return (
                <button key={c.key} onClick={() => setCatFilter(c.key)} style={{
                  padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: active ? '#2563eb' : 'var(--surface-2, #f1f5f9)',
                  color: active ? '#fff' : (c.warn ? '#b91c1c' : 'var(--text-muted)'),
                }}>
                  {c.warn && !active ? '⚠ ' : ''}{c.label} ({c.count})
                </button>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
                  <th style={{ ...TH, width: '44px' }}></th>
                  <th style={TH}>Item</th>
                  {showTypeColumn && <th style={TH}>Type</th>}
                  <th style={{ ...TH, textAlign: 'right' }}>Stock</th>
                  <th style={TH}>Status</th>
                  <th style={{ ...TH, width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {tableItems.length === 0 && (
                  <tr><td colSpan={showTypeColumn ? 6 : 5} style={{ padding: '32px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '4px' }}>{inventoryCopy.emptyIcon}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{inventoryCopy.noItemsTitle}</div>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>Try a different filter or add a new item.</div>
                  </td></tr>
                )}
                {tableItems.map((item, i) => {
                  const status = statusOf(item)
                  const empty = status === 'empty'
                  return (
                    <tr
                      key={item.id}
                      onClick={() => goUpdate(item.id)}
                      style={{
                        borderBottom: i < tableItems.length - 1 ? '1px solid var(--border)' : 'none',
                        background: empty ? 'rgba(220, 38, 38, 0.04)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = empty ? 'rgba(220, 38, 38, 0.08)' : 'var(--surface-2, #f8fafc)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = empty ? 'rgba(220, 38, 38, 0.04)' : 'transparent' }}
                    >
                      <td style={{ padding: '9px 0 9px 12px', fontSize: '18px', width: '44px' }}>{iconForItem(item, selectedAnimalType)}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text)' }}>{item.name}</td>
                      {showTypeColumn && (
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '99px',
                            background: item.category === 'supply' ? '#f0fdf4' : '#eff6ff',
                            color: item.category === 'supply' ? '#16a34a' : '#2563eb',
                          }}>
                            {item.category === 'supply' ? 'Supply' : 'Product'}
                          </span>
                        </td>
                      )}
                      <td style={{ padding: '9px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                        <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '4px', fontSize: '12px' }}>{item.unit}</span>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <StatusDot status={status} />
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); goUpdate(item.id) }}
                          title="Update stock"
                          aria-label={`Update ${item.name}`}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '6px', color: 'var(--text-muted)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2, #f1f5f9)'; e.currentTarget.style.color = 'var(--accent, #2563eb)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                        >
                          <PencilIcon />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden" style={{ padding: '8px' }}>
            {tableItems.length === 0 && (
              <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>{inventoryCopy.emptyIcon}</div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{inventoryCopy.noItemsTitle}</div>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>Try a different filter or add a new item.</div>
              </div>
            )}
            {tableItems.map((item) => {
              const status = statusOf(item)
              const empty = status === 'empty'
              const hasThreshold = item.threshold > 0
              const pct = hasThreshold
                ? Math.min(100, Math.max(0, (item.quantity / (item.threshold * 2)) * 100))
                : null
              const barColor = status === 'empty' ? '#dc2626' : status === 'low' ? '#d97706' : '#16a34a'
              return (
                <button
                  key={item.id}
                  onClick={() => goUpdate(item.id)}
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    background: empty ? 'rgba(220, 38, 38, 0.04)' : 'var(--surface)',
                    borderRadius: '10px', padding: '10px 12px', marginBottom: '6px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    boxShadow: '0 1px 2px var(--shadow-color, rgba(0,0,0,.04))',
                  }}
                >
                  <div style={{ fontSize: '22px' }}>{iconForItem(item, selectedAnimalType)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>{item.name}</span>
                      <StatusDot status={status} showLabel={false} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        <strong style={{ color: 'var(--text)' }}>{item.quantity}</strong> {item.unit}
                      </span>
                      {hasThreshold && (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          alert ≤ {item.threshold}
                        </span>
                      )}
                    </div>
                    {hasThreshold && (
                      <div style={{ marginTop: '6px', height: '4px', borderRadius: '99px', background: 'var(--surface-2, #f1f5f9)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 150ms ease' }} />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Update Stock ── */}
      {tab === 'update' && (
        <div className="card" style={{ padding: '16px' }}>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={L}>Item</label>
              <select className="input-field" value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ fontWeight: 600 }}>
                <option value="">— Choose an item —</option>
                <optgroup label="Supplies">
                  {allItems.filter(i => i.category === 'supply').map(i => (
                    <option key={i.id} value={i.id}>{i.name}  ·  {i.quantity} {i.unit}{isLow(i) ? ' ⚠' : ''}</option>
                  ))}
                </optgroup>
                <optgroup label="Products">
                  {allItems.filter(i => i.category === 'sellable').map(i => (
                    <option key={i.id} value={i.id}>{i.name}  ·  {i.quantity} {i.unit}{isLow(i) ? ' ⚠' : ''}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {selected && (
              <div style={{ padding: '7px 12px', borderRadius: '8px', background: 'var(--surface-2, #f8fafc)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{iconForItem(selected, selectedAnimalType)}</span>
                <span>Current: <strong>{selected.quantity} {selected.unit}</strong></span>
                <StatusDot status={statusOf(selected)} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'add',    label: '+ Add',   color: '#16a34a', bg: '#f0fdf4' },
                { key: 'remove', label: '− Remove', color: '#dc2626', bg: '#fef2f2' },
                { key: 'set',    label: '= Set',    color: '#2563eb', bg: '#eff6ff' },
              ].map(m => (
                <button key={m.key} type="button" onClick={() => setMode(m.key)} style={{
                  flex: 1, padding: '7px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  background: mode === m.key ? m.bg : 'var(--surface-2, #f1f5f9)',
                  color: mode === m.key ? m.color : 'var(--text-muted)',
                  outline: mode === m.key ? `2px solid ${m.color}` : 'none',
                  outlineOffset: '1px',
                }}>
                  {m.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={L}>Qty{selected ? ` (${selected.unit})` : ''}</label>
                <input className="input-field" type="number" min="0" step="any" value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder={mode === 'set' ? 'New total' : 'Amount'}
                  required={mode !== 'set'} />
              </div>
              <div>
                <label style={L}>Date</label>
                <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={L}>Notes (optional)</label>
              <input className="input-field" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason…" />
            </div>

            {selectedId && selectedId !== 'eggs' && (
              <div style={{ padding: '10px 12px', background: 'var(--surface-2, #f8fafc)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...L, marginBottom: '4px' }}>Alert limit{selected ? ` (${selected.unit})` : ''}</label>
                  <input
                    className="input-field" type="number" min="0" step="any"
                    value={threshold} onChange={e => setThreshold(e.target.value)}
                    placeholder="0 = off"
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '18px', maxWidth: '140px' }}>
                  Warn when stock falls at or below this number
                </p>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ fontSize: '13px' }}>Save Changes</button>
          </form>
        </div>
      )}

      {/* ── Tab: Activity ── */}
      {tab === 'activity' && (
        <div className="card" style={{ padding: '14px' }}>
          {recentMoves.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>No activity yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {recentMoves.map((m, i) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
                  padding: '8px 4px',
                  borderBottom: i < recentMoves.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700,
                    background: m.mode === 'add' ? '#f0fdf4' : m.mode === 'remove' ? '#fef2f2' : '#eff6ff',
                    color: m.mode === 'add' ? '#16a34a' : m.mode === 'remove' ? '#dc2626' : '#2563eb',
                  }}>
                    {m.mode === 'add' ? '+' : m.mode === 'remove' ? '−' : '='}
                  </span>
                  <span style={{ flex: 1, color: 'var(--text)', fontWeight: 500 }}>{m.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{m.qty} {m.unit}</span>
                  <span style={{ color: 'var(--text-dim)', minWidth: '48px', textAlign: 'right', fontSize: '12px' }}>{fmtDate(m.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const L  = { display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }
const TH = { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '12px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '.04em' }
const MENU_ITEM = {
  display: 'flex', alignItems: 'center', gap: '8px',
  width: '100%', padding: '8px 10px', borderRadius: '6px',
  border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
  color: 'var(--text)', textAlign: 'left',
}
