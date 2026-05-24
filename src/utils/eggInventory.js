export const EGG_UNITS = {
  pieces: {
    label: 'Pieces',
    shortLabel: 'pcs',
    multiplier: 1,
  },
  dozens: {
    label: 'Dozens',
    shortLabel: 'doz',
    multiplier: 12,
  },
  trays: {
    label: 'Trays',
    shortLabel: 'trays',
    multiplier: 30,
  },
}

export function normalizeEggUnit(unit) {
  return EGG_UNITS[unit] ? unit : 'pieces'
}

export function toEggPieces(quantity, unit = 'pieces') {
  const normalizedUnit = normalizeEggUnit(unit)
  const numericQuantity = Number(quantity || 0)

  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    return 0
  }

  return Math.round(numericQuantity * EGG_UNITS[normalizedUnit].multiplier)
}

export function fromEggPieces(pieces, unit = 'pieces') {
  const normalizedUnit = normalizeEggUnit(unit)
  const numericPieces = Number(pieces || 0)
  const rawValue = numericPieces / EGG_UNITS[normalizedUnit].multiplier

  if (normalizedUnit === 'pieces') {
    return Math.round(rawValue)
  }

  return Number(rawValue.toFixed(2))
}

export function formatEggQuantity(pieces, unit = 'pieces') {
  return `${fromEggPieces(pieces, unit)} ${EGG_UNITS[normalizeEggUnit(unit)].shortLabel}`
}
