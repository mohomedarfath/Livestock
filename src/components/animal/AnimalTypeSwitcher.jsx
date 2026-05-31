import { useAnimalType } from '../../animal/useAnimalType'

export default function AnimalTypeSwitcher() {
  const {
    selectedAnimalType,
    setSelectedAnimalType,
    animalTypeOptions,
    animalTypeDetails,
  } = useAnimalType()

  if (animalTypeOptions.length <= 1) return null

  return (
    <label
      className="focus-within:shadow-[var(--shadow-focus)] hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
      }}
    >
      <span className="text-[11px] uppercase tracking-[.08em]" style={{ color: 'var(--text-dim)' }}>
        Type
      </span>
      <span aria-hidden style={{ fontSize: '16px', lineHeight: 1 }}>
        {animalTypeDetails.emoji}
      </span>
      <select
        value={selectedAnimalType}
        onChange={(event) => setSelectedAnimalType(event.target.value)}
        className="bg-transparent text-sm font-semibold focus:outline-none"
        style={{ color: 'var(--text)' }}
        aria-label="Animal type"
      >
        {animalTypeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
