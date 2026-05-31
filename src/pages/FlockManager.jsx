import { useState, useEffect } from 'react'
import { useFlocks } from '../hooks/useFlocks'
import { useConfirm } from '../components/ui'
import { useAnimalType } from '../animal/useAnimalType'

// ── Breed data (from metrics database) ────────────────────────────────────────
const BREEDS = [
  { name: 'Rhode Island Red', purpose: 'Dual-purpose', eggsPerYear: [250, 300], eggColor: 'Brown', temperament: 'Friendly, docile, calm', coldHardy: true },
  { name: 'Buff Orpington', purpose: 'Dual-purpose', eggsPerYear: [180, 200], eggColor: 'Brown', temperament: 'Friendly, excellent mothers, docile', coldHardy: true },
  { name: 'Leghorn', purpose: 'Egg layer', eggsPerYear: [280, 320], eggColor: 'White', temperament: 'Active, alert, good foragers', coldHardy: true },
  { name: 'Barred Plymouth Rock', purpose: 'Dual-purpose', eggsPerYear: [200, 250], eggColor: 'Brown', temperament: 'Gentle, calm, good with children', coldHardy: true },
  { name: 'Black Australorp', purpose: 'Dual-purpose', eggsPerYear: [200, 250], eggColor: 'Brown', temperament: 'Gentle, curious, kid-friendly', coldHardy: true },
  { name: 'Easter Egger', purpose: 'Egg layer', eggsPerYear: [280, 280], eggColor: 'Blue/Green', temperament: 'Low maintenance, friendly', coldHardy: true },
  { name: 'Silkie', purpose: 'Ornamental/Broody', eggsPerYear: [80, 120], eggColor: 'Brown', temperament: 'Docile, broody, excellent mothers', coldHardy: false },
  { name: 'Sussex', purpose: 'Dual-purpose', eggsPerYear: [200, 250], eggColor: 'Brown', temperament: 'Calm, curious, friendly', coldHardy: true },
  { name: 'Wyandotte', purpose: 'Dual-purpose', eggsPerYear: [180, 220], eggColor: 'Brown', temperament: 'Gentle, calm', coldHardy: true },
  { name: 'Broiler (Cobb 500)', purpose: 'Meat', eggsPerYear: [0, 0], eggColor: 'N/A', temperament: 'Calm, fast growing', coldHardy: false },
  { name: 'Broiler (Ross 308)', purpose: 'Meat', eggsPerYear: [0, 0], eggColor: 'N/A', temperament: 'Calm, fast growing', coldHardy: false },
  { name: 'Mixed / Other', purpose: 'Mixed', eggsPerYear: [150, 250], eggColor: 'Varies', temperament: 'Varies', coldHardy: true },
]

// ── Vaccination schedule (from metrics database) ───────────────────────────────
const VACCINATION_SCHEDULE = [
  { day: 1, week: 0, name: "Marek's Disease", protection: 'Prevents paralysis and tumors', note: 'At hatchery — subcutaneous injection', critical: true, pct: 97 },
  { day: 5, week: 1, name: 'Newcastle Disease', protection: 'Respiratory protection', note: 'Eye drops or drinking water', critical: true, pct: 90 },
  { day: 7, week: 1, name: 'Infectious Bronchitis (IB)', protection: 'Respiratory protection', note: 'Eye drops or drinking water', critical: true, pct: 85 },
  { day: 14, week: 2, name: 'Gumboro / IBD', protection: 'Immune system protection', note: 'Drinking water', critical: false, pct: 88 },
  { day: 21, week: 3, name: 'Gumboro / IBD Booster', protection: 'Immune system protection', note: 'Drinking water', critical: false, pct: 88 },
  { day: 28, week: 4, name: 'Fowl Pox', protection: 'Prevents viral infection', note: 'Wing web injection', critical: false, pct: 92 },
  { day: 70, week: 10, name: 'Avian Encephalomyelitis', protection: 'Neurological protection', note: 'Wing web injection', critical: false, pct: 85 },
]

// ── Brooder heat schedule (from metrics database) ──────────────────────────────
const BROODER_TEMPS = [
  { week: 1, celsius: 35, fahrenheit: 95, note: 'Critical first week — highest heat needed' },
  { week: 2, celsius: 32, fahrenheit: 90, note: 'Reduce by 5°F each week' },
  { week: 3, celsius: 29, fahrenheit: 85, note: 'Continue gradual reduction' },
  { week: 4, celsius: 27, fahrenheit: 80, note: 'Chicks becoming more independent' },
  { week: 5, celsius: 24, fahrenheit: 75, note: 'Almost fully feathered' },
  { week: 6, celsius: 21, fahrenheit: 70, note: 'Ready to move to coop if outdoor temp > 10°C' },
]

// ── Chick behaviour guide ──────────────────────────────────────────────────────
const BEHAVIOR_GUIDE = [
  { label: 'Too Cold', color: 'blue', signs: ['Huddled together under lamp', 'Loud, distressed chirping'], action: 'Lower lamp or increase wattage' },
  { label: 'Perfect', color: 'green', signs: ['Evenly spread, contented peeping', 'Eating and drinking normally'], action: 'No change needed' },
  { label: 'Too Hot', color: 'red', signs: ['Spread far from heat, panting', 'Silent or droopy heads'], action: 'Raise lamp or decrease wattage' },
]

// ── Health indicators (from metrics database) ──────────────────────────────────
const HEALTH_SIGNS = {
  healthy: [
    'Bright, alert eyes',
    'Active, energetic behaviour',
    'Smooth feathers in good condition',
    'Clean, normal droppings',
    'Regular eating and drinking',
    'Normal social behaviour with flock',
  ],
  illness: [
    'Lethargy or depression',
    'Reduced eating or drinking',
    'Abnormal droppings (watery or blood-stained)',
    'Coughing, sneezing, nasal discharge',
    'Limping or inability to walk',
    'Sudden drop in egg production',
    'Isolation from flock',
  ],
  dehydration: [
    'Wings held outward or panting',
    'Dry, sparse droppings',
    'Loss of appetite',
    'Reduced egg production',
    'Wobbly or unbalanced walking',
  ],
}

// ── Broiler weight targets by week ────────────────────────────────────────────
const BROILER_WEEKLY = [
  { week: 1, weight: 0.17, feed: '13–18 g/bird/day', fcr: 0.9, note: 'Starter phase — keep brooder warm, 23 hrs light' },
  { week: 2, weight: 0.38, feed: '28–35 g/bird/day', fcr: 1.1, note: 'Rapid bone and organ growth' },
  { week: 3, weight: 0.72, feed: '52–65 g/bird/day', fcr: 1.3, note: 'Switch to grower feed at day 14' },
  { week: 4, weight: 1.10, feed: '80–100 g/bird/day', fcr: 1.5, note: 'Peak growth rate — watch ventilation' },
  { week: 5, weight: 1.55, feed: '110–130 g/bird/day', fcr: 1.7, note: 'Finisher feed from day 28; watch heat stress' },
  { week: 6, weight: 2.00, feed: '130–150 g/bird/day', fcr: 1.85, note: 'Ready for live weight of ~2 kg (Cobb 500 target)' },
  { week: 7, weight: 2.50, feed: '145–165 g/bird/day', fcr: 2.0, note: 'Ross 308 target ~2.5 kg at 7 weeks' },
  { week: 8, weight: 2.90, feed: '160–180 g/bird/day', fcr: 2.1, note: 'Withdraw feed 6–8 hrs before slaughter' },
]

const BROILER_VACCINATIONS = [
  { day: 1, name: "Marek's Disease", note: 'At hatchery — subcutaneous', critical: true },
  { day: 1, name: 'Newcastle (ND) + IB', note: 'Spray or eye drops at hatchery', critical: true },
  { day: 7, name: 'Gumboro / IBD', note: 'Drinking water — week 1', critical: true },
  { day: 14, name: 'Gumboro Booster', note: 'Drinking water — week 2', critical: false },
  { day: 21, name: 'Newcastle Booster', note: 'Eye drops or water — week 3', critical: false },
]

function getBroilerGuide(ageWeeks) {
  const wkData = BROILER_WEEKLY[Math.min(Math.max(Math.ceil(ageWeeks) - 1, 0), 7)]
  const isReady = ageWeeks >= 6

  let stage, stageColor, milestone
  if (ageWeeks < 1) {
    stage = { label: 'Day-Old Chick', color: 'yellow', emoji: '🐣' }
    milestone = 'Ensure all chicks drinking within 2 hrs of arrival'
  } else if (ageWeeks < 3) {
    stage = { label: 'Starter Phase', color: 'orange', emoji: '🐤' }
    milestone = `Target weight: ~${wkData?.weight ?? 0.4} kg at week ${Math.ceil(ageWeeks)}`
  } else if (ageWeeks < 5) {
    stage = { label: 'Grower Phase', color: 'green', emoji: '🐓' }
    milestone = `Target weight: ~${wkData?.weight ?? 1.1} kg at week ${Math.ceil(ageWeeks)}`
  } else if (ageWeeks < 7) {
    stage = { label: 'Finisher Phase', color: 'blue', emoji: '🏁' }
    milestone = isReady ? '✅ Market weight reached — ready for harvest' : `Target: ~${wkData?.weight ?? 2.0} kg. Harvest in ${Math.max(0, 6 - Math.floor(ageWeeks))} week(s)`
  } else {
    stage = { label: 'Harvest Ready', color: 'purple', emoji: '⚠️' }
    milestone = '⚠️ Past optimal market age — FCR increasing. Schedule harvest soon.'
  }

  const broilerFeeds = [
    { phase: 'Starter (Day 0–14)', protein: '22–24%', energy: '3,000 kcal/kg', note: 'Crumble form — easy for chicks to eat' },
    { phase: 'Grower (Day 15–28)', protein: '20–22%', energy: '3,100 kcal/kg', note: 'Pellet or crumble' },
    { phase: 'Finisher (Day 29+)', protein: '18–20%', energy: '3,200 kcal/kg', note: 'Pellet — maximise weight gain efficiency' },
    { phase: 'Pre-harvest (last 6–8 hrs)', protein: '—', energy: '—', note: 'Withdraw feed before slaughter (do not starve water)' },
  ]

  return { stage, stageColor, milestone, wkData, broilerFeeds, isReady }
}

// ── Age-based care guide (layers) ─────────────────────────────────────────────
function getAgeGuide(ageWeeks) {
  let stage, feed, light, space, water, milestone

  if (ageWeeks < 2) {
    stage = { label: 'Brooder Chick', color: 'yellow', emoji: '🐣' }
    feed = { type: 'Chick Starter Crumbles', protein: '20%', calcium: null, amount: '10–20 g/bird/day', supplements: ['Grit (free-choice)'], tip: 'Keep feed fresh — change twice daily; chicks eat little but often' }
    light = { hours: '23 hrs on / 1 hr off', tip: 'Near-continuous light helps chicks find feed & water' }
    space = { area: '0.05 m²/bird (0.5 sq ft)', tip: 'Small brooder space retains heat better' }
    water = '10–50 ml/bird/day'
    milestone = 'Ensure all chicks drinking within 2 hrs of arrival'
  } else if (ageWeeks < 6) {
    stage = { label: 'Young Chick', color: 'orange', emoji: '🐤' }
    feed = { type: 'Chick Starter / Grower', protein: '18–20%', calcium: null, amount: '30–60 g/bird/day', supplements: ['Grit (free-choice)'], tip: 'Increase feeder space as birds grow to prevent crowding' }
    light = { hours: '18–20 hrs on', tip: 'Begin reducing light hours gradually each week' }
    space = { area: '0.08 m²/bird (0.9 sq ft)', tip: 'Expand space to prevent feather pecking' }
    water = '50–150 ml/bird/day'
    milestone = 'Feathers developing — monitor for pecking and crowding'
  } else if (ageWeeks < 14) {
    stage = { label: 'Grower', color: 'green', emoji: '🐓' }
    feed = { type: 'Grower Feed', protein: '16%', calcium: null, amount: '60–90 g/bird/day', supplements: ['Grit (free-choice)'], tip: 'Avoid high-calcium feeds — can damage kidneys before laying begins' }
    light = { hours: '12–14 hrs on', tip: 'Reducing light delays sexual maturity, resulting in better first-egg size' }
    space = { area: '0.12 m²/bird (1.3 sq ft)', tip: 'Provide perches and enrichment items' }
    water = '150–200 ml/bird/day'
    milestone = 'Comb & wattles developing — separate males if needed'
  } else if (ageWeeks < 20) {
    stage = { label: 'Pullet / Developer', color: 'purple', emoji: '🐔' }
    feed = { type: 'Pullet / Developer Feed', protein: '14–16%', calcium: null, amount: '90–110 g/bird/day', supplements: ['Grit (free-choice)'], tip: 'Switch to layer feed only when first egg appears — not before' }
    light = { hours: '10–12 hrs on', tip: 'Low light hours prevent premature laying and small first eggs' }
    space = { area: '0.18 m²/bird (2 sq ft)', tip: 'Install nest boxes ready — 1 box per 3–4 hens' }
    water = '180–220 ml/bird/day'
    milestone = 'First egg expected around week 18–20 for most breeds'
  } else {
    stage = { label: 'Adult / Laying Hen', color: 'blue', emoji: '🥚' }
    feed = {
      type: 'Layer Feed',
      protein: '16%',
      calcium: '3.5–5%',
      amount: '110–130 g/bird/day (¼ lb)',
      supplements: ['Oyster Shell (free-choice)', 'Grit (free-choice)', 'Probiotics (optional)', "Brewer's Yeast (optional)"],
      tip: 'Provide oyster shell separately — laying hens self-regulate calcium intake for strong shells',
    }
    light = { hours: '16 hrs on / 8 hrs off', tip: 'Consistent 16 hrs light maximises production; use timer for reliability' }
    space = { area: '0.25 m²/bird (2.5 sq ft)', tip: '1 nest box per 3–4 hens; 10–12 inches roost bar per bird' }
    water = '250–500 ml/bird/day (up to 1 L in hot weather)'
    milestone = ageWeeks < 30
      ? 'Ramping up to peak production (~90% lay rate at ~25 weeks)'
      : ageWeeks < 72
        ? 'Peak production phase — monitor lay rate weekly'
        : 'Consider flock replacement — production declining after 72 weeks'
  }

  // Temperature — use exact brooder schedule for young chicks, adult range for older
  let temp
  if (ageWeeks <= 6) {
    const wk = Math.min(Math.max(Math.ceil(ageWeeks) || 1, 1), 6)
    const brooder = BROODER_TEMPS.find(b => b.week === wk) || BROODER_TEMPS[0]
    temp = {
      celsius: `${brooder.celsius}°C`,
      fahrenheit: `${brooder.fahrenheit}°F`,
      tip: brooder.note,
      isBrooder: true,
    }
  } else {
    temp = {
      celsius: '13–24°C',
      fahrenheit: '55–75°F',
      tip: 'Ideal adult range. Heat stress above 30°C significantly reduces lay rate.',
      isBrooder: false,
    }
  }

  const upcomingVaccines = VACCINATION_SCHEDULE.filter(v => v.week >= ageWeeks && v.week <= ageWeeks + 3)
  const nextVaccine = VACCINATION_SCHEDULE.find(v => v.week >= ageWeeks)

  return { stage, feed, temp, light, space, water, milestone, upcomingVaccines, nextVaccine }
}

const STAGE_COLORS = {
  yellow: 'bg-[color-mix(in_srgb,#eab308_15%,var(--surface))] text-[#eab308] border border-[color-mix(in_srgb,#eab308_30%,transparent)]',
  orange: 'bg-[color-mix(in_srgb,#f97316_15%,var(--surface))] text-[#f97316] border border-[color-mix(in_srgb,#f97316_30%,transparent)]',
  green: 'bg-[color-mix(in_srgb,#10b981_15%,var(--surface))] text-[#10b981] border border-[color-mix(in_srgb,#10b981_30%,transparent)]',
  purple: 'bg-[color-mix(in_srgb,#a855f7_15%,var(--surface))] text-[#a855f7] border border-[color-mix(in_srgb,#a855f7_30%,transparent)]',
  blue: 'bg-[color-mix(in_srgb,#3b82f6_15%,var(--surface))] text-[#3b82f6] border border-[color-mix(in_srgb,#3b82f6_30%,transparent)]',
}
// ── Component ──────────────────────────────────────────────────────────────────
export default function FlockManager() {
  const confirm = useConfirm()
  const { flocks, createFlock, removeFlock } = useFlocks()
  const { animalTypeDetails } = useAnimalType()
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [selectedFlockId, setSelectedFlockId] = useState(null)
  const [activeTab, setActiveTab] = useState({})
  const [purposeFilter, setPurposeFilter] = useState('All')
  const [logs, setLogs] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    count: '',
    penNumber: '',
    dateAdded: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('clucktrack_logs')
      if (savedLogs) setLogs(JSON.parse(savedLogs))
    } catch {
      setLogs([])
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const calculateLiveBirds = (flock) => {
    const flockLogs = logs.filter(log => new Date(log.date) >= new Date(flock.dateAdded))
    const totalDeaths = flockLogs.reduce((sum, log) => sum + (log.deaths || 0), 0)
    return Math.max(0, flock.count - totalDeaths)
  }

  const getFlockAge = (dateAdded) => {
    const d = new Date(dateAdded);
    if (isNaN(d.getTime())) return { days: 0, weeks: 0 };
    const days = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(days / 7)
    return { days, weeks }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.breed || !formData.count || !formData.penNumber) {
      setFormError('Please fill all fields')
      return
    }
    await createFlock({
      name: formData.name,
      breed: formData.breed,
      count: parseInt(formData.count),
      penNumber: formData.penNumber,
      dateAdded: formData.dateAdded,
    })
    setFormData({ name: '', breed: '', count: '', penNumber: '', dateAdded: new Date().toISOString().split('T')[0] })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete flock?',
      description: 'This flock will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete flock',
      destructive: true,
    })
    if (!confirmed) return
    await removeFlock(id)
  }

  const getTab = (flockId) => activeTab[flockId] || 'overview'
  const setTab = (flockId, tab) => setActiveTab(prev => ({ ...prev, [flockId]: tab }))

  const totalBirds = flocks.reduce((sum, flock) => sum + calculateLiveBirds(flock), 0)

  const PURPOSE_FILTERS = [
    { label: 'All', icon: '🐔', match: null },
    { label: 'Egg', icon: '🥚', match: 'Egg layer' },
    { label: 'Meat', icon: '🍗', match: 'Meat' },
    { label: 'Dual-purpose', icon: '⚖️', match: 'Dual-purpose' },
  ]

  const filteredFlocks = purposeFilter === 'All'
    ? flocks
    : flocks.filter(f => {
      const info = BREEDS.find(b => b.name === f.breed)
      return info?.purpose === purposeFilter
    })

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">{animalTypeDetails.groupManagerTitle}</h1>
        <p className="text-[var(--text-muted)] text-sm">Manage your {animalTypeDetails.groupPlural.toLowerCase()}</p>
      </div>

      {/* Total Birds Summary */}
      <div className="card mb-6" style={{ background: "color-mix(in srgb, #3b82f6 10%, var(--surface))", border: "1px solid color-mix(in srgb, #3b82f6 20%, transparent)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--text-muted)] font-medium">Total {animalTypeDetails.animalPlural}</p>
            <p className="text-3xl font-bold text-[#3b82f6] mt-1">{totalBirds}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{flocks.length} {flocks.length !== 1 ? animalTypeDetails.groupPlural.toLowerCase() : animalTypeDetails.groupLabel.toLowerCase()}</p>
          </div>
          <div className="text-5xl opacity-30">🐔</div>
        </div>
      </div>

      {/* Add Flock Button */}
      <button
        onClick={() => { setShowForm(!showForm); setFormError('') }}
        className="btn-primary w-full mb-6"
      >
        {showForm ? '✕ Cancel' : '➕ Add New Flock'}
      </button>

      {/* Add Flock Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-farm-orange bg-opacity-10 border-2 border-farm-orange mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Flock Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="e.g., Flock Alpha" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Breed</label>
              <select name="breed" value={formData.breed} onChange={handleChange} className="input-field">
                <option value="">Select a breed</option>
                {BREEDS.map(b => (
                  <option key={b.name} value={b.name}>{b.name} — {b.purpose}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Number of {animalTypeDetails.animalPlural}</label>
                <input type="number" name="count" value={formData.count} onChange={handleChange}
                  placeholder="e.g., 100" className="input-field" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Pen Number</label>
                <input type="text" name="penNumber" value={formData.penNumber} onChange={handleChange}
                  placeholder="e.g., A1" className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Date Added (Hatch / Arrival Date)</label>
              <input type="date" name="dateAdded" value={formData.dateAdded} onChange={handleChange} className="input-field" />
            </div>
            {formError && (
              <div style={{ background: "color-mix(in srgb, #ef4444 10%, var(--surface))", color: "#ef4444" }} className=" border-l-4 border-red-500 p-3 rounded">
                <p className="text-[#ef4444] text-sm">{formError}</p>
              </div>
            )}
            <button type="submit" className="btn-primary w-full">Save Flock</button>
          </div>
        </form>
      )}

      {/* Purpose Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {PURPOSE_FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setPurposeFilter(f.match ?? 'All')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${purposeFilter === (f.match ?? 'All')
              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
            <span className="opacity-70 text-xs">
              ({(f.match === null ? flocks : flocks.filter(fl => BREEDS.find(b => b.name === fl.breed)?.purpose === f.match)).length})
            </span>
          </button>
        ))}
      </div>

      {/* Flocks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredFlocks.length === 0 ? (
          <div style={{ background: "color-mix(in srgb, #3b82f6 10%, var(--surface))", color: "#3b82f6" }} className="card  text-center py-8">
            <p className="text-[var(--text-muted)] text-sm">
              {flocks.length === 0 ? `No ${animalTypeDetails.groupPlural.toLowerCase()} yet. Click "Add New" to get started.` : `No ${purposeFilter.toLowerCase()} ${animalTypeDetails.groupPlural.toLowerCase()} found.`}
            </p>
          </div>
        ) : (
          filteredFlocks.map(flock => {
            const liveBirds = calculateLiveBirds(flock)
            const dead = flock.count - liveBirds
            const { days, weeks } = getFlockAge(flock.dateAdded)
            const breedInfo = BREEDS.find(b => b.name === flock.breed)
            const isBroiler = breedInfo?.purpose === 'Meat'
            const guide = isBroiler ? null : getAgeGuide(weeks)
            const broilerG = isBroiler ? getBroilerGuide(weeks) : null
            const activeStage = (isBroiler ? broilerG?.stage : guide?.stage) || 'starter'
            const stageClass = STAGE_COLORS[activeStage.color] || STAGE_COLORS.blue
            const isOpen = selectedFlockId === flock.id
            const tab = getTab(flock.id)

            return (
              <div key={flock.id} className="card border-l-4 border-farm-orange hover:shadow-lg transition-shadow">

                {/* Card Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-[var(--text)]">{flock.name}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{flock.breed} | Pen: {flock.penNumber}</p>
                  </div>
                  <button onClick={() => handleDelete(flock.id)}
                    className="text-[#ef4444] hover:text-[#ef4444] font-medium text-sm">Delete</button>
                </div>

                {/* Age Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold mb-3 ${stageClass}`}>
                  <span>{activeStage.emoji}</span>
                  <span>{activeStage.label}</span>
                  {isBroiler && <span className="bg-red-600 text-white px-1.5 rounded-full">BROILER</span>}
                  <span className="opacity-60">·</span>
                  <span>{weeks}w {days % 7}d old</span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div style={{ background: "color-mix(in srgb, #3b82f6 10%, var(--surface))", color: "#3b82f6" }} className=" p-3 rounded">
                    <p className="text-xs text-[var(--text-muted)]">Live {animalTypeDetails.animalPlural}</p>
                    <p className="text-2xl font-bold text-[#3b82f6]">{liveBirds}</p>
                  </div>
                  <div style={{ background: "color-mix(in srgb, #ef4444 10%, var(--surface))", color: "#ef4444" }} className=" p-3 rounded">
                    <p className="text-xs text-[var(--text-muted)]">Deaths</p>
                    <p className="text-2xl font-bold text-[#ef4444]">{dead}</p>
                  </div>
                  <div className="bg-[var(--surface-2)] p-3 rounded">
                    <p className="text-xs text-[var(--text-muted)]">Added</p>
                    <p className="text-sm font-medium text-[var(--text)]">
                      {new Date(flock.dateAdded).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Upcoming vaccine alert */}
                {!isBroiler && guide.upcomingVaccines.length > 0 && (
                  <div style={{ background: "color-mix(in srgb, #f59e0b 10%, var(--surface))", color: "#f59e0b" }} className=" border border-amber-300 rounded-lg px-3 py-2 mb-3 flex items-center gap-2 text-xs">
                    <span className="text-lg">💉</span>
                    <div>
                      <span className="font-semibold text-[#f59e0b]">Vaccine due soon: </span>
                      <span className="text-[#f59e0b]">{guide.upcomingVaccines[0].name} (Week {guide.upcomingVaccines[0].week})</span>
                    </div>
                  </div>
                )}

                {/* View Details Toggle */}
                <button
                  onClick={() => setSelectedFlockId(isOpen ? null : flock.id)}
                  className="w-full btn-secondary text-sm"
                >
                  {isOpen ? '▲ Hide Details' : '▼ View Details & Care Guide'}
                </button>

                {/* Expanded Details Panel */}
                {isOpen && (
                  <div className="mt-3 border-t border-[var(--border)] pt-3">

                    {/* Tabs */}
                    <div role="tablist" aria-label={`${flock.name} details`} className="flex gap-1 mb-4 bg-[var(--surface-2)] p-1 rounded-lg">
                      {[
                        { id: 'overview', label: '📋 Info' },
                        { id: 'feed', label: '🌾 Feed' },
                        { id: 'vaccines', label: '💉 Vacc' },
                        { id: 'environ', label: '🌡️ Env' },
                        { id: 'health', label: '🏥 Health' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          role="tab"
                          aria-selected={tab === t.id}
                          onClick={() => setTab(flock.id, t.id)}
                          className={`focus-ring flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t.id ? 'bg-[var(--surface)] shadow text-[var(--text)]' : 'text-[var(--text-dim)] hover:text-gray-700'
                            }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* ── TAB: Overview ──────────────────────────────────── */}
                    {tab === 'overview' && (() => {
                      const flockLogs = logs.filter(log => new Date(log.date) >= new Date(flock.dateAdded))
                      const recent = [...flockLogs].reverse().slice(0, 5)
                      const totalEggs = flockLogs.reduce((sum, l) => sum + (l.eggs || 0), 0)
                      const totalFeed = flockLogs.reduce((sum, l) => sum + (l.feed || 0), 0)
                      const avgEggsPerDay = flockLogs.length > 0 ? (totalEggs / flockLogs.length).toFixed(1) : 0
                      const milestone = isBroiler ? broilerG.milestone : guide.milestone
                      return (
                        <div className="space-y-3">
                          {/* Breed info card */}
                          {breedInfo && (
                            <div className="bg-farm-orange bg-opacity-10 border border-farm-orange border-opacity-30 rounded-lg p-3 text-xs space-y-1.5">
                              <p className="font-semibold text-[var(--text)] text-sm">{breedInfo.name}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[var(--text-dim)]">Purpose: </span>
                                  <span className="font-medium">{breedInfo.purpose}</span>
                                </div>
                                {!isBroiler && (
                                  <div>
                                    <span className="text-[var(--text-dim)]">Egg colour: </span>
                                    <span className="font-medium">{breedInfo.eggColor}</span>
                                  </div>
                                )}
                                {!isBroiler && breedInfo.eggsPerYear[1] > 0 && (
                                  <div>
                                    <span className="text-[var(--text-dim)]">Eggs/year: </span>
                                    <span className="font-medium text-[#eab308]">{breedInfo.eggsPerYear[0]}–{breedInfo.eggsPerYear[1]}</span>
                                  </div>
                                )}
                                {isBroiler && (
                                  <div>
                                    <span className="text-[var(--text-dim)]">Market age: </span>
                                    <span className="font-medium text-[#ef4444]">6–8 weeks</span>
                                  </div>
                                )}
                                {isBroiler && (
                                  <div>
                                    <span className="text-[var(--text-dim)]">Target weight: </span>
                                    <span className="font-medium text-[#ef4444]">2.0–2.9 kg</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-[var(--text-dim)]">Cold hardy: </span>
                                  <span className="font-medium">{breedInfo.coldHardy ? '✅ Yes' : '❌ No'}</span>
                                </div>
                              </div>
                              <p className="text-[var(--text-muted)] italic">{breedInfo.temperament}</p>
                            </div>
                          )}

                          {/* Broiler: week-by-week weight targets */}
                          {isBroiler && (
                            <div style={{ background: "color-mix(in srgb, #ef4444 10%, var(--surface))", color: "#ef4444" }} className=" border border-red-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-[#ef4444] mb-2">📊 Weekly Weight Targets</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[var(--text-dim)] border-b border-red-100">
                                      <th className="text-left pb-1">Week</th>
                                      <th className="text-right pb-1">Weight</th>
                                      <th className="text-right pb-1">FCR</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {BROILER_WEEKLY.map(w => (
                                      <tr key={w.week} className={`border-b border-red-50 ${Math.ceil(weeks) === w.week ? 'bg-red-100 font-semibold' : ''}`}>
                                        <td className="py-1">Wk {w.week}</td>
                                        <td className="text-right">{w.weight} kg</td>
                                        <td className="text-right">{w.fcr}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Layer log stats */}
                          {!isBroiler && (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div style={{ background: "color-mix(in srgb, #eab308 10%, var(--surface))", color: "#eab308" }} className=" rounded p-2 text-center">
                                <p className="text-[var(--text-dim)]">Total Eggs</p>
                                <p className="font-bold text-[#eab308] text-base">{totalEggs}</p>
                              </div>
                              <div style={{ background: "color-mix(in srgb, #10b981 10%, var(--surface))", color: "#10b981" }} className=" rounded p-2 text-center">
                                <p className="text-[var(--text-dim)]">Avg/Day</p>
                                <p className="font-bold text-[#10b981] text-base">{avgEggsPerDay}</p>
                              </div>
                              <div style={{ background: "color-mix(in srgb, #3b82f6 10%, var(--surface))", color: "#3b82f6" }} className=" rounded p-2 text-center">
                                <p className="text-[var(--text-dim)]">Feed (kg)</p>
                                <p className="font-bold text-[#3b82f6] text-base">{totalFeed.toFixed(1)}</p>
                              </div>
                            </div>
                          )}

                          {/* Broiler feed stats */}
                          {isBroiler && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div style={{ background: "color-mix(in srgb, #3b82f6 10%, var(--surface))", color: "#3b82f6" }} className=" rounded p-2 text-center">
                                <p className="text-[var(--text-dim)]">Total Feed (kg)</p>
                                <p className="font-bold text-[#3b82f6] text-base">{totalFeed.toFixed(1)}</p>
                              </div>
                              <div style={{ background: "color-mix(in srgb, #f97316 10%, var(--surface))", color: "#f97316" }} className=" rounded p-2 text-center">
                                <p className="text-[var(--text-dim)]">Deaths</p>
                                <p className="font-bold text-[#f97316] text-base">{dead}</p>
                              </div>
                            </div>
                          )}

                          <div className="bg-farm-orange bg-opacity-10 rounded-lg p-3 text-xs">
                            <p className="font-semibold text-[var(--text)] mb-1">🎯 Milestone</p>
                            <p className="text-[var(--text)]">{milestone}</p>
                          </div>

                          {/* Recent log entries */}
                          <div>
                            <p className="font-semibold text-[var(--text)] text-sm mb-2">Recent Log Entries</p>
                            {recent.length === 0 ? (
                              <p className="text-xs text-[var(--text-dim)] italic">No log entries yet.</p>
                            ) : (
                              <div className="space-y-1">
                                {recent.map((log, i) => (
                                  <div key={i} className="flex justify-between bg-[var(--surface-2)] rounded px-3 py-1.5 text-xs">
                                    <span className="text-[var(--text-dim)]">{log.date} {log.time}</span>
                                    <span>💔{log.deaths} 🌾{log.feed}kg{!isBroiler && ` 🥚${log.eggs}`}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* ── TAB: Feed ──────────────────────────────────────── */}
                    {tab === 'feed' && (
                      <div className="space-y-3">
                        {isBroiler ? (
                          <>
                            <div style={{ background: "color-mix(in srgb, #ef4444 10%, var(--surface))", color: "#ef4444" }} className=" border border-red-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-[#ef4444] mb-1">Current Week Feed</p>
                              <p className="font-bold text-[#ef4444] text-base">{broilerG.wkData?.feed ?? '—'}</p>
                              <p className="text-xs text-[var(--text-dim)] mt-1">{broilerG.wkData?.note}</p>
                            </div>
                            <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                              <p className="text-xs font-semibold text-[var(--text)] px-3 py-2 bg-[var(--surface-2)] border-b">🌾 Broiler Feed Phases</p>
                              {broilerG.broilerFeeds.map((f, i) => (
                                <div key={i} className="px-3 py-2 border-b border-[var(--border)] last:border-0 text-xs">
                                  <p className="font-semibold text-[var(--text)]">{f.phase}</p>
                                  <div className="flex gap-4 mt-0.5 text-[var(--text-muted)]">
                                    <span>Protein: <strong>{f.protein}</strong></span>
                                    <span>Energy: <strong>{f.energy}</strong></span>
                                  </div>
                                  <p className="text-[var(--text-dim)] mt-0.5 italic">{f.note}</p>
                                </div>
                              ))}
                            </div>
                            <div style={{ background: "color-mix(in srgb, #3b82f6 10%, var(--surface))", color: "#3b82f6" }} className=" rounded-lg p-3 text-xs">
                              <p className="text-xs text-[var(--text-dim)] mb-1">💧 Daily Water</p>
                              <p className="font-bold text-[#3b82f6]">~2× feed volume (always fresh)</p>
                              <p className="text-[var(--text-dim)] mt-1">Broilers drink heavily — check drinkers 3× daily in hot weather.</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ background: "color-mix(in srgb, #10b981 10%, var(--surface))", color: "#10b981" }} className=" border border-green-200 rounded-lg p-3">
                              <p className="text-xs text-[var(--text-dim)] font-medium mb-1">Recommended Feed Type</p>
                              <p className="font-bold text-[#10b981] text-base">{guide.feed.type}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-[var(--surface-2)] rounded-lg p-3">
                                <p className="text-xs text-[var(--text-dim)] mb-1">Protein Level</p>
                                <p className="font-bold text-[var(--text)]">{guide.feed.protein}</p>
                              </div>
                              <div className="bg-[var(--surface-2)] rounded-lg p-3">
                                <p className="text-xs text-[var(--text-dim)] mb-1">Daily Amount</p>
                                <p className="font-bold text-[var(--text)]">{guide.feed.amount}</p>
                              </div>
                              {guide.feed.calcium && (
                                <div className="bg-[var(--surface-2)] rounded-lg p-3 col-span-2">
                                  <p className="text-xs text-[var(--text-dim)] mb-1">Calcium (for shells)</p>
                                  <p className="font-bold text-[var(--text)]">{guide.feed.calcium}</p>
                                </div>
                              )}
                            </div>
                            <div style={{ background: "color-mix(in srgb, #eab308 10%, var(--surface))", color: "#eab308" }} className=" border border-yellow-200 rounded-lg p-3">
                              <p className="text-xs text-[var(--text-dim)] font-medium mb-2">Supplements</p>
                              <ul className="space-y-1">
                                {guide.feed.supplements.map((s, i) => (
                                  <li key={i} className="text-xs text-[#eab308] flex items-center gap-1.5">
                                    <span>✦</span>{s}
                                  </li>
                                ))}
                              </ul>
                              <p className="text-xs text-[var(--text-dim)] mt-2">Max 10% of diet from treats (scraps, mealworms, vegetables)</p>
                            </div>
                            <div className="bg-[var(--surface-2)] rounded-lg p-3">
                              <p className="text-xs text-[var(--text-dim)] mb-1">💧 Daily Water Intake</p>
                              <p className="font-bold text-[#3b82f6]">{guide.water}</p>
                              <p className="text-xs text-[var(--text-dim)] mt-1">Water = ~2× feed volume. Ensure clean, fresh water always available.</p>
                            </div>
                            <div style={{ background: "color-mix(in srgb, #eab308 10%, var(--surface))", color: "#eab308" }} className=" border-l-4 border-yellow-400 p-3 rounded text-xs">
                              <p className="font-semibold text-[#eab308] mb-1">💡 Tip</p>
                              <p className="text-[#eab308]">{guide.feed.tip}</p>
                            </div>
                            <div style={{ background: "color-mix(in srgb, #3b82f6 10%, var(--surface))", color: "#3b82f6" }} className=" rounded-lg p-3 text-xs">
                              <p className="font-semibold text-[#3b82f6] mb-1">📐 Space per Bird (inside coop)</p>
                              <p className="text-[#3b82f6]">{guide.space.area}</p>
                              <p className="text-[var(--text-dim)] mt-1">{guide.space.tip}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* ── TAB: Vaccines ──────────────────────────────────── */}
                    {tab === 'vaccines' && (
                      <div className="space-y-3">
                        {isBroiler ? (
                          <>
                            <div style={{ background: "color-mix(in srgb, #f59e0b 10%, var(--surface))", color: "#f59e0b" }} className=" border border-amber-200 rounded-lg p-3 text-xs">
                              <p className="font-semibold text-[#f59e0b] mb-1">ℹ️ Broiler Vaccination Note</p>
                              <p className="text-[#f59e0b]">Broilers have a short 6–8 week cycle. Most vaccines are given in the first 3 weeks only. Avoid live vaccines close to harvest.</p>
                            </div>
                            <div className="space-y-1">
                              {BROILER_VACCINATIONS.map((v, i) => {
                                const doneDay = days > v.day
                                return (
                                  <div key={i} className={`px-3 py-2 rounded text-xs border ${doneDay ? 'bg-[var(--surface-2)] opacity-60 border-[var(--border)]' : 'bg-[var(--surface)] border-amber-100'}`}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-base shrink-0">{doneDay ? '✅' : '⬜'}</span>
                                      <div className="flex-1 min-w-0">
                                        <span className={`font-medium ${doneDay ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>{v.name}</span>
                                        {v.critical && !doneDay && <span className="ml-1 text-red-500 font-bold">★</span>}
                                      </div>
                                      <span className="text-[var(--text-dim)] shrink-0">Day {v.day}</span>
                                    </div>
                                    {!doneDay && <p className="text-[var(--text-dim)] mt-0.5 pl-7">{v.note}</p>}
                                  </div>
                                )
                              })}
                            </div>
                            <p className="text-xs text-[var(--text-dim)]">★ = Critical. Consult your vet for regional disease requirements.</p>
                          </>
                        ) : (
                          <>
                            {guide.upcomingVaccines.length > 0 && (
                              <div style={{ background: "color-mix(in srgb, #f59e0b 10%, var(--surface))", color: "#f59e0b" }} className=" border border-amber-300 rounded-lg p-3">
                                <p className="text-xs font-bold text-[#f59e0b] mb-2">⚠️ Due Now / Coming Up</p>
                                {guide.upcomingVaccines.map((v, i) => (
                                  <div key={i} className="py-1.5 border-b border-amber-100 last:border-0">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-medium text-amber-900">{v.name}</span>
                                      <span className="text-[#f59e0b]">Week {v.week} · Day {v.day}</span>
                                    </div>
                                    <p className="text-xs text-[#f59e0b] mt-0.5">{v.protection} — {v.note}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-[var(--text)] mb-2">Full Vaccination Schedule</p>
                              <div className="space-y-1">
                                {VACCINATION_SCHEDULE.map((v, i) => {
                                  const done = weeks > v.week
                                  const current = weeks >= v.week && weeks <= v.week + 2
                                  return (
                                    <div key={i} className={`px-3 py-2 rounded text-xs ${current ? 'bg-amber-50 border border-amber-200' :
                                      done ? 'bg-[var(--surface-2)] opacity-60' : 'bg-[var(--surface)] border border-[var(--border)]'
                                      }`}>
                                      <div className="flex items-center gap-2">
                                        <span className="text-base shrink-0">{done ? '✅' : current ? '⏰' : '⬜'}</span>
                                        <div className="flex-1 min-w-0">
                                          <span className={`font-medium ${done ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>{v.name}</span>
                                          {v.critical && !done && <span className="ml-1 text-red-500 font-bold">★</span>}
                                        </div>
                                        <span className="text-[var(--text-dim)] shrink-0">Wk {v.week} · Day {v.day}</span>
                                      </div>
                                      {!done && <p className="text-[var(--text-dim)] mt-0.5 pl-7">{v.protection} · {v.note}</p>}
                                      {!done && (
                                        <div className="mt-0.5 pl-7 flex items-center gap-1">
                                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${v.pct}%`, maxWidth: '100px' }} />
                                          <span className="text-[var(--text-dim)]">{v.pct}% effective</span>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                              <p className="text-xs text-[var(--text-dim)] mt-2">★ = Critical vaccines. Consult your local vet for regional disease requirements.</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* ── TAB: Environment ───────────────────────────────── */}
                    {tab === 'environ' && (
                      <div className="space-y-3">
                        {/* Temperature */}
                        <div style={{ background: "color-mix(in srgb, #ef4444 10%, var(--surface))", color: "#ef4444" }} className=" border border-red-200 rounded-lg p-3">
                          <p className="text-xs text-[var(--text-dim)] font-medium mb-1">🌡️ Recommended Temperature</p>
                          {isBroiler ? (
                            <>
                              <p className="font-bold text-[#ef4444] text-lg">{weeks <= 1 ? '32–35°C' : weeks <= 2 ? '30–32°C' : weeks <= 3 ? '27–29°C' : '24–27°C'}</p>
                              <p className="text-xs text-[var(--text-muted)] mt-1 italic">Reduce by ~3°C per week. Broilers are heat-sensitive after week 3 — ensure good ventilation.</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-[#ef4444] text-lg">{guide.temp.celsius}</p>
                              <p className="text-xs text-red-500">{guide.temp.fahrenheit}</p>
                              <p className="text-xs text-[var(--text-muted)] mt-2 italic">{guide.temp.tip}</p>
                            </>
                          )}
                        </div>

                        {/* Brooder behavior guide (only for young chicks) */}
                        {(isBroiler ? weeks <= 3 : guide.temp.isBrooder) && (
                          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                            <p className="text-xs font-semibold text-[var(--text)] px-3 py-2 bg-[var(--surface-2)] border-b border-[var(--border)]">
                              🐣 Read Chick Behaviour
                            </p>
                            <div className="divide-y divide-gray-100">
                              {BEHAVIOR_GUIDE.map(b => (
                                <div key={b.label} className="px-3 py-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.color === 'blue' ? 'bg-blue-100 text-[#3b82f6]' :
                                      b.color === 'green' ? 'bg-green-100 text-[#10b981]' :
                                        'bg-red-100 text-[#ef4444]'
                                      }`}>{b.label}</span>
                                  </div>
                                  <ul className="text-xs text-[var(--text-muted)] space-y-0.5 mb-1">
                                    {b.signs.map((s, i) => <li key={i}>· {s}</li>)}
                                  </ul>
                                  <p className="text-xs font-medium text-[var(--text)]">→ {b.action}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Brooder heat schedule */}
                        {(isBroiler ? weeks <= 3 : guide.temp.isBrooder) && (
                          <div style={{ background: "color-mix(in srgb, #f97316 10%, var(--surface))", color: "#f97316" }} className=" border border-orange-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-[#f97316] mb-2">📉 Brooder Heat Schedule</p>
                            <div className="space-y-1">
                              {BROODER_TEMPS.map(b => (
                                <div key={b.week} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${Math.ceil(weeks) === b.week || (weeks === 0 && b.week === 1)
                                  ? 'bg-orange-200 font-semibold text-orange-900'
                                  : 'text-[var(--text-muted)]'
                                  }`}>
                                  <span className="w-12">Week {b.week}</span>
                                  <span className="font-medium">{b.celsius}°C / {b.fahrenheit}°F</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Lighting */}
                        <div style={{ background: "color-mix(in srgb, #eab308 10%, var(--surface))", color: "#eab308" }} className=" border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-[var(--text-dim)] font-medium mb-1">💡 Lighting Schedule</p>
                          {isBroiler ? (
                            <>
                              <p className="font-bold text-[#eab308]">{weeks <= 1 ? '23 hrs on / 1 hr off' : weeks <= 3 ? '20 hrs on / 4 hrs off' : '18 hrs on / 6 hrs off'}</p>
                              <p className="text-xs text-[var(--text-muted)] mt-1 italic">High light in early weeks encourages feeding. Reduce from week 4 to improve leg health.</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-[#eab308]">{guide.light.hours}</p>
                              <p className="text-xs text-[var(--text-muted)] mt-1 italic">{guide.light.tip}</p>
                            </>
                          )}
                        </div>

                        {/* Floor Space */}
                        <div style={{ background: "color-mix(in srgb, #3b82f6 10%, var(--surface))", color: "#3b82f6" }} className=" border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-[var(--text-dim)] font-medium mb-1">📐 Floor Space (Coop)</p>
                          {isBroiler ? (
                            <>
                              <p className="font-bold text-[#3b82f6]">{weeks <= 2 ? '0.05 m²/bird' : weeks <= 4 ? '0.09 m²/bird' : '0.14 m²/bird'}</p>
                              <p className="text-xs text-[var(--text-muted)] mt-1 italic">Broilers grow fast — expand space each week to prevent crowding and disease.</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-[#3b82f6]">{guide.space.area}</p>
                              <p className="text-xs text-[var(--text-muted)] mt-1 italic">{guide.space.tip}</p>
                            </>
                          )}
                        </div>

                        {/* General checks */}
                        <div className="bg-[var(--surface-2)] rounded-lg p-3 text-xs space-y-2">
                          <p className="font-semibold text-[var(--text)]">General Environment Checks</p>
                          <ul className="space-y-1 text-[var(--text-muted)]">
                            <li>✔ Ventilation — no ammonia smell, fresh air flow</li>
                            <li>✔ Litter — dry, not caked; change if wet or clumped</li>
                            <li>✔ Drinkers — clean, no algae, always full</li>
                            <li>✔ Feeders — at bird back-height to reduce waste</li>
                            <li>✔ Biosecurity — footbath at entrance, limit visitors</li>
                            <li>✔ Predator check — secure latches, no gaps &gt; 6mm</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* ── TAB: Health ────────────────────────────────────── */}
                    {tab === 'health' && (
                      <div className="space-y-3">
                        {/* Healthy signs */}
                        <div style={{ background: "color-mix(in srgb, #10b981 10%, var(--surface))", color: "#10b981" }} className=" border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-bold text-[#10b981] mb-2">✅ Signs of a Healthy Flock</p>
                          <ul className="space-y-1">
                            {HEALTH_SIGNS.healthy.map((s, i) => (
                              <li key={i} className="text-xs text-[#10b981] flex items-start gap-1.5">
                                <span className="shrink-0">·</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Illness signs */}
                        <div style={{ background: "color-mix(in srgb, #ef4444 10%, var(--surface))", color: "#ef4444" }} className=" border border-red-200 rounded-lg p-3">
                          <p className="text-xs font-bold text-[#ef4444] mb-2">🚨 Warning Signs — Contact a Vet</p>
                          <ul className="space-y-1">
                            {HEALTH_SIGNS.illness.map((s, i) => (
                              <li key={i} className="text-xs text-[#ef4444] flex items-start gap-1.5">
                                <span className="shrink-0">·</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Dehydration signs */}
                        <div style={{ background: "color-mix(in srgb, #f97316 10%, var(--surface))", color: "#f97316" }} className=" border border-orange-200 rounded-lg p-3">
                          <p className="text-xs font-bold text-[#f97316] mb-2">💧 Signs of Dehydration</p>
                          <ul className="space-y-1">
                            {HEALTH_SIGNS.dehydration.map((s, i) => (
                              <li key={i} className="text-xs text-[#f97316] flex items-start gap-1.5">
                                <span className="shrink-0">·</span>{s}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-[#f97316] mt-2 font-medium">
                            Water pH optimal: 6.0–6.8 · Temp: 10–15°C (50–60°F)
                          </p>
                        </div>

                        {/* Health check schedule */}
                        <div className="bg-[var(--surface-2)] rounded-lg p-3 text-xs space-y-2">
                          <p className="font-semibold text-[var(--text)]">Health Check Schedule</p>
                          <div className="space-y-2">
                            <div>
                              <p className="font-medium text-[var(--text-muted)]">Weekly</p>
                              <p className="text-[var(--text-dim)]">Inspect feathers for mites/lice · Check feet for sores · Observe behaviour and droppings</p>
                            </div>
                            <div>
                              <p className="font-medium text-[var(--text-muted)]">Monthly</p>
                              <p className="text-[var(--text-dim)]">Fecal analysis for parasites · Detailed individual health inspection · Review feed/water intake trends</p>
                            </div>
                            <div>
                              <p className="font-medium text-[var(--text-muted)]">Yearly</p>
                              <p className="text-[var(--text-dim)]">Comprehensive veterinary examination</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
