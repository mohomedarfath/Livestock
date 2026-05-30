import { useMemo, useState } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useShopCustomers } from '../../hooks/useShopCustomers'
import { useShopOrders } from '../../hooks/useShopOrders'
import { useConfirm } from '../../components/ui'

const EMPTY_CUSTOMER = { name: '', phone: '', address: '', notes: '' }

export default function ShopCustomers() {
  const { fmt } = useCurrency()
  const confirm = useConfirm()
  const { customers, loading, error, createCustomer, updateCustomer, removeCustomer } = useShopCustomers()
  const { orders } = useShopOrders()
  const [form, setForm] = useState(EMPTY_CUSTOMER)
  const [editingId, setEditingId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const selectedCustomer = customers.find((customer) => customer.id === selectedId) || customers[0] || null
  const customerOrders = useMemo(
    () => orders.filter((order) => selectedCustomer && order.customerId === selectedCustomer.id),
    [orders, selectedCustomer]
  )
  const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)

  function editCustomer(customer) {
    setEditingId(customer.id)
    setSelectedId(customer.id)
    setForm({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
    })
  }

  function resetForm() {
    setEditingId('')
    setForm(EMPTY_CUSTOMER)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setMessage('')
    if (!form.name.trim()) return setFormError('Customer name is required.')

    try {
      if (editingId) {
        await updateCustomer(editingId, form)
        setMessage('Customer updated.')
      } else {
        const created = await createCustomer(form)
        setSelectedId(created.id)
        setMessage('Customer created.')
      }
      resetForm()
    } catch (err) {
      setFormError(err.message || 'Failed to save customer.')
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Shop Customers</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage retail customers and view order history.</p>
      </div>

      {(message || formError || error) && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: message ? '#f0fdf4' : '#fef2f2', color: message ? '#15803d' : '#dc2626' }}>
          {message || formError || error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1fr]">
        <form onSubmit={handleSubmit} className="card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--text)]">{editingId ? 'Edit Customer' : 'New Customer'}</h2>
            {editingId && <button type="button" className="btn-secondary text-sm" onClick={resetForm}>Cancel</button>}
          </div>
          <label className="space-y-1 block">
            <span className="label-text">Name</span>
            <input className="input-field" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="space-y-1 block">
            <span className="label-text">Phone</span>
            <input className="input-field" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label className="space-y-1 block">
            <span className="label-text">Address</span>
            <input className="input-field" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
          </label>
          <label className="space-y-1 block">
            <span className="label-text">Notes</span>
            <textarea className="input-field" rows="3" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <button type="submit" className="btn-primary">{editingId ? 'Save Customer' : 'Create Customer'}</button>
        </form>

        <section className="card">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Customers</h2>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No customers yet.</p>
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedId(customer.id)}
                  className="focus-ring w-full text-left rounded-lg px-3 py-2"
                  style={{
                    background: selectedCustomer?.id === customer.id ? 'var(--accent-bg)' : 'var(--surface-2)',
                    color: selectedCustomer?.id === customer.id ? 'var(--accent-ink)' : 'var(--text)',
                  }}
                >
                  <span className="font-semibold">{customer.name}</span>
                  <span className="block text-xs">{customer.phone || 'No phone'}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedCustomer && (
        <section className="card">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">{selectedCustomer.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">{selectedCustomer.phone || 'No phone'} {selectedCustomer.address ? `- ${selectedCustomer.address}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={() => editCustomer(selectedCustomer)}>Edit</button>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Delete customer?',
                    description: `${selectedCustomer.name}'s profile will be removed. Past orders will keep their saved customer name.`,
                    confirmLabel: 'Delete',
                    destructive: true,
                  })
                  if (!ok) return
                  await removeCustomer(selectedCustomer.id)
                  setSelectedId('')
                }}
              >Delete</button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 mb-4">
            <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
              <p className="text-sm text-[var(--text-muted)]">Orders</p>
              <p className="text-2xl font-bold text-[var(--text)]">{customerOrders.length}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
              <p className="text-sm text-[var(--text-muted)]">Total Spent</p>
              <p className="text-2xl font-bold text-[var(--accent-ink)]">{fmt(totalSpent)}</p>
            </div>
          </div>
          {customerOrders.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No orders for this customer yet.</p>
          ) : (
            <div className="space-y-2">
              {customerOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)' }}>
                  <div>
                    <p className="font-semibold text-[var(--text)]">{order.orderNumber}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(order.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <p className="font-bold text-[var(--accent-ink)]">{fmt(order.total)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
