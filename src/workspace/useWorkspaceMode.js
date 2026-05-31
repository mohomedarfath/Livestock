import { useContext } from 'react'
import { WorkspaceModeContext } from './WorkspaceModeContextValue'

export function useWorkspaceMode() {
  const value = useContext(WorkspaceModeContext)
  if (!value) {
    throw new Error('useWorkspaceMode must be used inside WorkspaceModeProvider')
  }
  return value
}
