import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { currentRole, loading: tenantLoading } = useTenant()

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="card text-center">
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  if (allowedRoles?.length && currentRole && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
