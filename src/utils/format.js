export function formatNumber(value, options = {}) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return new Intl.NumberFormat('en-IN', options).format(number)
}

export function formatCurrency(value, currency = 'LKR') {
  const number = Number(value)
  if (!Number.isFinite(number)) return 'Rs 0'

  const symbol = {
    LKR: 'Rs',
    INR: 'Rs',
    USD: '$',
    EUR: 'EUR',
    GBP: 'GBP',
  }[currency] || currency

  return `${symbol} ${formatNumber(number, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(value, style = 'short') {
  if (!value) return '-'
  const date = new Date(String(value).includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'

  const options = {
    short: { day: '2-digit', month: 'short', year: 'numeric' },
    compact: { day: '2-digit', month: 'short' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
  }[style] || { day: '2-digit', month: 'short', year: 'numeric' }

  return date.toLocaleDateString('en-IN', options)
}

export function formatHours(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0h'
  return `${number.toFixed(1)}h`
}
