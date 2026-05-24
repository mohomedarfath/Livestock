export const COW_BREEDS = [
  'Jersey',
  'Friesian',
  'Friesian Cross',
  'Sahiwal',
  'Ayrshire',
  'AMZ',
  'Local',
  'Mixed / Other',
]

export const COW_STATUSES = [
  'milking',
  'dry',
  'pregnant',
  'calf',
  'heifer',
  'sold',
  'dead',
]

export const BREEDING_EVENT_TYPES = [
  'heat',
  'ai',
  'pregnancy_check',
  'calving',
  'dry_off',
  'abortion',
]

export function todayIso() {
  return new Date().toISOString().split('T')[0]
}

export function addDays(dateString, days) {
  if (!dateString) return ''
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-IN')
}

export function daysUntil(dateString) {
  if (!dateString) return null
  const date = new Date(`${dateString}T00:00:00`)
  const now = new Date(`${todayIso()}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return Math.ceil((date - now) / (1000 * 60 * 60 * 24))
}

export function litresForLog(log) {
  return Number(log.totalLitres ?? ((log.morningLitres || 0) + (log.eveningLitres || 0) - (log.rejectedLitres || 0)))
}

export function logsForCow(milkLogs, cowId) {
  return milkLogs.filter((log) => String(log.cowId) === String(cowId))
}

export function sumLitres(milkLogs) {
  return milkLogs.reduce((sum, log) => sum + litresForLog(log), 0)
}

export function latestRecord(records, dateKey) {
  return [...records].sort((left, right) => String(right[dateKey] || '').localeCompare(String(left[dateKey] || '')))[0] || null
}

export function getMilkDropAlerts(cows, milkLogs) {
  return cows
    .map((cow) => {
      const cowLogs = logsForCow(milkLogs, cow.id)
        .filter((log) => litresForLog(log) > 0)
        .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')))

      if (cowLogs.length < 2) return null

      const latest = cowLogs[0]
      const previous = cowLogs.slice(1, 4)
      const previousAverage = previous.reduce((sum, log) => sum + litresForLog(log), 0) / previous.length
      if (previousAverage <= 0) return null

      const dropPercent = ((previousAverage - litresForLog(latest)) / previousAverage) * 100
      if (dropPercent < 15) return null

      return {
        cow,
        latestLitres: litresForLog(latest),
        previousAverage,
        dropPercent,
      }
    })
    .filter(Boolean)
}

export function statusLabel(value) {
  return String(value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function fieldNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}
