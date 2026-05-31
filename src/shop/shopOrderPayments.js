export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'online', label: 'Online' },
  { id: 'credit', label: 'Credit / due' },
]

const METHOD_IDS = new Set(PAYMENT_METHODS.map((method) => method.id))

function normalizeNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0
}

export function normalizePaymentMethod(method) {
  return METHOD_IDS.has(method) ? method : 'cash'
}

export function calculateOrderPayment({ total, paidAmount, paymentMethod } = {}) {
  const normalizedTotal = normalizeNumber(total)
  const normalizedPaid = normalizeNumber(paidAmount)
  const balanceDue = Math.max(0, normalizedTotal - normalizedPaid)
  const changeDue = Math.max(0, normalizedPaid - normalizedTotal)
  let paymentStatus = 'paid'

  if (balanceDue > 0 && normalizedPaid > 0) paymentStatus = 'partial'
  else if (balanceDue > 0 || normalizePaymentMethod(paymentMethod) === 'credit') paymentStatus = 'unpaid'

  return {
    paidAmount: normalizedPaid,
    balanceDue,
    changeDue,
    paymentStatus,
  }
}

export function paymentMethodLabel(method) {
  return PAYMENT_METHODS.find((entry) => entry.id === normalizePaymentMethod(method))?.label || 'Cash'
}
