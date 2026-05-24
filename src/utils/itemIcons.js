const POULTRY_ICONS_BY_ID = {
  eggs: '🥚',
  hatching_eggs: '🐣',
  live_birds: '🐔',
  day_old_chicks: '🐥',
  meat: '🍗',
  chicken_parts: '🍗',
  manure: '💩',
  feed: '🌾',
  medicine: '💊',
  water: '💧',
  supplements: '🧪',
  bedding: '🪵',
}

const COW_ICONS_BY_ID = {
  live_birds: '🐄',
  day_old_chicks: '🐄',
  meat: '🥩',
  manure: '💩',
  feed: '🌾',
  medicine: '💊',
  water: '💧',
  supplements: '🧂',
  bedding: '🌾',
}

const GOAT_ICONS_BY_ID = {
  live_birds: '🐐',
  day_old_chicks: '🐐',
  meat: '🥩',
  manure: '💩',
  feed: '🌾',
  medicine: '💊',
  water: '💧',
  supplements: '🧂',
  bedding: '🌾',
}

const POULTRY_KEYWORD_RULES = [
  [/egg/i, '🥚'],
  [/chick(s|en)?s?$|\bchick\b|day[-\s]?old/i, '🐥'],
  [/bird|hen|rooster|pullet|broiler/i, '🐔'],
  [/meat|dressed|drumstick|breast|thigh|wing/i, '🍗'],
  [/manure|compost/i, '💩'],
  [/feed|grain|corn|maize|pellet/i, '🌾'],
  [/medic|vaccin|antibiot/i, '💊'],
  [/water|fluid/i, '💧'],
  [/supplement|vitamin|mineral/i, '🧪'],
  [/bedding|litter|shaving|sawdust/i, '🪵'],
]

const COW_KEYWORD_RULES = [
  [/cow|cattle|calf|calves|heifer|bull|steer/i, '🐄'],
  [/milk|dairy/i, '🥛'],
  [/beef|meat|carcass|cut/i, '🥩'],
  [/manure|compost/i, '💩'],
  [/feed|fodder|hay|silage|grain|concentrate|maize|pellet/i, '🌾'],
  [/medic|vaccin|antibiot|deworm/i, '💊'],
  [/water|fluid/i, '💧'],
  [/supplement|vitamin|mineral|salt/i, '🧂'],
  [/bedding|straw|litter|shaving|sawdust/i, '🌾'],
]

const GOAT_KEYWORD_RULES = [
  [/goat|kid|buck|doe/i, '🐐'],
  [/milk|dairy/i, '🥛'],
  [/meat|carcass|cut/i, '🥩'],
  [/manure|compost/i, '💩'],
  [/feed|fodder|hay|silage|grain|concentrate|maize|pellet/i, '🌾'],
  [/medic|vaccin|antibiot|deworm/i, '💊'],
  [/water|fluid/i, '💧'],
  [/supplement|vitamin|mineral|salt/i, '🧂'],
  [/bedding|straw|litter|shaving|sawdust/i, '🌾'],
]

const FALLBACK = {
  poultry: { supply: '🧺', sellable: '📦' },
  cow: { supply: '🌾', sellable: '🐄' },
  goat: { supply: '🌾', sellable: '🐐' },
}

function iconSetFor(animalType) {
  if (animalType === 'cow') return [COW_ICONS_BY_ID, COW_KEYWORD_RULES, FALLBACK.cow]
  if (animalType === 'goat') return [GOAT_ICONS_BY_ID, GOAT_KEYWORD_RULES, FALLBACK.goat]
  return [POULTRY_ICONS_BY_ID, POULTRY_KEYWORD_RULES, FALLBACK.poultry]
}

export function iconForItem(item, animalType = 'poultry') {
  if (!item) return '📦'

  const [iconsById, keywordRules, fallback] = iconSetFor(animalType)
  if (iconsById[item.id]) return iconsById[item.id]

  const name = item.name || ''
  for (const [pattern, icon] of keywordRules) {
    if (pattern.test(name)) return icon
  }

  return fallback[item.category] || '📦'
}
