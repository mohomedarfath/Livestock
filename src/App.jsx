import { Suspense } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TenantProvider, useTenant } from './context/TenantContext'
import { SyncStatusProvider } from './context/SyncStatusContext'
import { AnimalTypeProvider } from './animal/AnimalTypeContext'
import { WorkspaceModeProvider, useWorkspaceMode } from './workspace/WorkspaceModeContext'
import { isModuleEnabledForWorkspace } from './workspace/workspaceModes'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PlatformDashboard from './pages/platform/PlatformDashboard'
import AppLayout from './components/app/AppLayout'
import ProtectedRoute from './components/app/ProtectedRoute'
import { APP_MODULES, MODULE_PATH_BY_ID } from './app/modules'
import { ConfirmProvider, ToastProvider } from './components/ui'

function FeaturePage({ module }) {
  const navigate = useNavigate()
  const { canAccessModule } = useTenant()
  const { workspaceMode } = useWorkspaceMode()

  if (!canAccessModule(module.id) || !isModuleEnabledForWorkspace(module, workspaceMode)) {
    return <Navigate to="/app" replace />
  }

  const Component = module.component

  return <Component onNavigate={(id) => navigate(MODULE_PATH_BY_ID[id] || '/app')} />
}

function resolveHomePath(user, currentOrganization, isPlatformOwner) {
  if (!user) return '/auth'
  if (currentOrganization) return '/app'
  if (isPlatformOwner) return '/platform'
  return '/onboarding'
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const { memberships, currentOrganization, loading: tenantLoading, isPlatformOwner } = useTenant()

  const homePath = resolveHomePath(user, currentOrganization, isPlatformOwner)

  if (loading || (user && tenantLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="card text-center">
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Loading LivestockTrack...</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--bg)' }} />}>
      <Routes>
        <Route
          path="/auth"
          element={user ? <Navigate to={homePath} replace /> : <LoginPage />}
        />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/platform"
            element={isPlatformOwner ? <PlatformDashboard /> : <Navigate to={currentOrganization ? '/app' : '/onboarding'} replace />}
          />
          <Route
            path="/onboarding"
            element={memberships.length > 0 ? <Navigate to={isPlatformOwner && !currentOrganization ? '/platform' : '/app'} replace /> : <OnboardingPage />}
          />

          <Route
            path="/app"
            element={currentOrganization ? <AppLayout /> : <Navigate to={isPlatformOwner ? '/platform' : '/onboarding'} replace />}
          >
            {APP_MODULES.map((module) => (
              <Route
                key={module.id}
                index={module.path === '/app'}
                path={module.path === '/app' ? undefined : module.path.replace('/app/', '')}
                element={
                  module.id === 'financial'
                    ? <Navigate to="/app/profit" replace />
                    : <FeaturePage module={module} />
                }
              />
            ))}
          </Route>
        </Route>

        <Route
          path="/"
          element={<Navigate to={homePath} replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <SyncStatusProvider>
          <WorkspaceModeProvider>
            <AnimalTypeProvider>
              <ConfirmProvider>
                <ToastProvider>
                  <AppRoutes />
                </ToastProvider>
              </ConfirmProvider>
            </AnimalTypeProvider>
          </WorkspaceModeProvider>
        </SyncStatusProvider>
      </TenantProvider>
    </AuthProvider>
  )
}
