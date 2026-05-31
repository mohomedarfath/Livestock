import { useCallback, useMemo, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { workspacesForRole } from '../app/accessControl'
import { WORKSPACE_MODES } from './workspaceModes'
import { WorkspaceModeContext } from './WorkspaceModeContextValue'

const STORAGE_KEY = 'livestocktrack_workspace_mode'

function getStoredMode() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function saveStoredMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Keep workspace switching usable in-memory if browser storage is unavailable.
  }
}

function normalizeMode(mode, availableModes) {
  if (availableModes.includes(mode)) return mode
  return availableModes[0] || 'farm'
}

export function WorkspaceModeProvider({ children }) {
  const { currentRole, roleDefinitions } = useTenant()
  const availableWorkspaces = useMemo(
    () => workspacesForRole(currentRole, roleDefinitions).filter((mode) => Boolean(WORKSPACE_MODES[mode])),
    [currentRole, roleDefinitions]
  )
  const [storedMode, setStoredMode] = useState(getStoredMode)
  const workspaceMode = normalizeMode(storedMode || availableWorkspaces[0], availableWorkspaces)

  const setWorkspaceMode = useCallback((nextMode) => {
    const normalized = normalizeMode(nextMode, availableWorkspaces)
    saveStoredMode(normalized)
    setStoredMode(normalized)
  }, [availableWorkspaces])

  const canUseWorkspace = useCallback(
    (mode) => availableWorkspaces.includes(mode),
    [availableWorkspaces]
  )

  const value = useMemo(
    () => ({
      workspaceMode,
      setWorkspaceMode,
      availableWorkspaces,
      canUseWorkspace,
      workspaceDetails: WORKSPACE_MODES[workspaceMode],
    }),
    [availableWorkspaces, canUseWorkspace, setWorkspaceMode, workspaceMode]
  )

  return (
    <WorkspaceModeContext.Provider value={value}>
      {children}
    </WorkspaceModeContext.Provider>
  )
}
