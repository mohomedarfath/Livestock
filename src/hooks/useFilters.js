import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useFilters(defaults) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    return Object.fromEntries(
      Object.entries(defaults).map(([key, defaultValue]) => [
        key,
        searchParams.get(key) ?? defaultValue,
      ])
    )
  }, [defaults, searchParams])

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        const defaultValue = defaults[key]
        if (value == null || value === '' || value === defaultValue) {
          next.delete(key)
        } else {
          next.set(key, value)
        }
        return next
      }, { replace: true })
    },
    [defaults, setSearchParams]
  )

  const resetFilters = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      Object.keys(defaults).forEach((key) => next.delete(key))
      return next
    }, { replace: true })
  }, [defaults, setSearchParams])

  return { filters, setFilter, resetFilters }
}
