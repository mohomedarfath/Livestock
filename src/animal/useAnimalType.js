import { useContext } from 'react'
import { AnimalTypeContext } from './AnimalTypeContextValue'

export function useAnimalType() {
  const value = useContext(AnimalTypeContext)
  if (!value) {
    throw new Error('useAnimalType must be used inside AnimalTypeProvider')
  }
  return value
}
