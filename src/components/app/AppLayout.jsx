import { Suspense, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { MODULE_BY_PATH } from '../../app/modules'
import { useTheme, THEMES } from '../../context/ThemeContext'
import { useCurrency } from '../../utils/currency'
import { useSyncStatus } from '../../context/SyncStatusContext'
import { useInstallPrompt } from '../../pwa/useInstallPrompt'
import { useOrganizationSettings } from '../../hooks/useOrganizationSettings'
import { Badge, CommandPalette, IconButton, Skeleton } from '../ui'
import AnimalTypeSwitcher from '../animal/AnimalTypeSwitcher'
import { useAnimalType } from '../../animal/AnimalTypeContext'
import { animalizeModule, isModuleEnabledForAnimalType } from '../../animal/animalTypes'

const NAV_GROUP_ORDER = ['Farm Operations', 'Health & Feed', 'Inventory', 'Finance', 'People', 'Administration']

function syncBadgeDetails(syncState, pendingWrites) {
  if (pendingWrites > 0) {
    return {
      variant: syncState === 'pending' ? 'warning' : 'info',
      label: `${pendingWrites} pending`,
      dot: syncState === 'pending' ? 'var(--color-warning-500)' : 'var(--color-info-500)',
    }
  }

  if (syncState === 'offline') {
    return {
      variant: 'warning',
      label: 'Offline',
      dot: 'var(--color-warning-500)',
    }
  }

  if (syncState === 'local') {
    return {
      variant: 'neutral',
      label: 'Local demo',
      dot: 'var(--text-dim)',
    }
  }

  return {
    variant: 'success',
    label: 'Synced',
    dot: 'var(--color-success-500)',
  }
}

const ICONS = {
  Home: '🏠',
  Users: '👥',
  Briefcase: '👷',
  ClipboardList: '📋',
  PenSquare: '✏️',
  Bird: '🐔',
  Cow: '🐄',
  Goat: '🐐',
  NotebookPen: '📝',
  Milk: '🥛',
  ReceiptText: '🧾',
  ChartNoAxesColumn: '📊',
  Wallet: '💰',
  ChartPie: '💹',
  ShieldPlus: '💉',
  Wheat: '🌾',
  Package: '📦',
  ShoppingCart: '🛒',
  Pill: '💊',
  Activity: '📈',
  BadgeDollarSign: '📉',
  Settings: '⚙️',
  FileText: '📄',
  MessageCircleMore: '💬',
  Egg: '🥚',
  EggFried: '🐣',
  Stethoscope: '🩺',
  HeartPulse: '💓',
  Trees: '🌿',
  Zap: '⚡',
}

function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        style={{ background: 'rgba(0,0,0,.06)', color: 'var(--text)' }}
      >
        <span>Theme</span>
        <span style={{ opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 rounded-xl overflow-hidden p-2"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px var(--shadow-md)',
            minWidth: '210px',
          }}
        >
          {Object.values(THEMES).map((theme) => {
            const selected = theme.id === themeId
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setThemeId(theme.id)
                  setOpen(false)
                }}
                className="focus-ring w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left"
                style={{
                  background: selected ? 'var(--accent-bg)' : 'transparent',
                  color: selected ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                <div className="flex gap-1">
                  {theme.preview.map((color) => (
                    <span
                      key={color}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '999px',
                        background: color,
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '13px' }}>
                  {theme.icon} {theme.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CurrencySwitcher() {
  const { currency, CURRENCIES, changeCurrency } = useCurrency()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        style={{ background: 'rgba(0,0,0,.06)', color: 'var(--text)' }}
      >
        <span>{currency.flag}</span>
        <span>{currency.symbol}</span>
        <span style={{ opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 rounded-xl overflow-hidden p-2"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px var(--shadow-md)',
            minWidth: '160px',
          }}
        >
          {Object.values(CURRENCIES).map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                changeCurrency(item.code)
                setOpen(false)
              }}
              className="focus-ring w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left"
              style={{
                background: currency.code === item.code ? 'var(--accent)' : 'transparent',
                color: currency.code === item.code ? '#fff' : 'var(--text-muted)',
              }}
            >
              <span>{item.flag}</span>
              <span>{item.symbol}</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.7 }}>{item.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarLink({ module, onSelect }) {
  return (
    <NavLink
      to={module.path}
      onClick={onSelect}
      className="focus-ring flex items-center gap-3 px-3 py-3 rounded-xl text-sm"
      style={({ isActive }) => ({
        background: isActive ? 'var(--accent-bg)' : 'transparent',
        color: isActive ? 'var(--accent-ink)' : 'var(--text-muted)',
        fontWeight: isActive ? 700 : 500,
      })}
    >
      <span>{ICONS[module.icon] || '•'}</span>
      <span>{module.label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const {
    memberships,
    currentOrganization,
    currentRole,
    currentRoleDefinition,
    accessibleModules,
    switchOrganization,
    isImpersonating,
    stopImpersonation,
    isPlatformOwner,
  } = useTenant()
  const { pendingWrites, syncState, lastError, clearSyncError } = useSyncStatus()
  const { selectedAnimalType, enabledAnimalTypes, animalTypeDetails } = useAnimalType()
  const { canInstall, promptInstall } = useInstallPrompt()
  const { settings: orgSettings, loading: orgSettingsLoading } = useOrganizationSettings()
  const farmLogo = orgSettingsLoading ? null : orgSettings?.logo
  const farmName = orgSettingsLoading
    ? currentOrganization?.name || 'LivestockTrack'
    : orgSettings?.farmName || currentOrganization?.name || 'LivestockTrack'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set(NAV_GROUP_ORDER))

  const visibleModules = useMemo(
    () =>
      accessibleModules
        .filter((module) => module.nav !== false)
        .filter((module) => isModuleEnabledForAnimalType(module.id, selectedAnimalType, enabledAnimalTypes))
        .map((module) => animalizeModule(module, animalTypeDetails)),
    [accessibleModules, animalTypeDetails, enabledAnimalTypes, selectedAnimalType]
  )
  const ungroupedModules = useMemo(() => visibleModules.filter((module) => !module.group), [visibleModules])
  const groupedModules = useMemo(
    () =>
      NAV_GROUP_ORDER
        .map((group) => ({
          group,
          modules: visibleModules.filter((module) => module.group === group),
        }))
        .filter((entry) => entry.modules.length > 0),
    [visibleModules]
  )
  const currentModule = animalizeModule(MODULE_BY_PATH[location.pathname], animalTypeDetails) || visibleModules[0]
  const breadcrumbs = currentModule?.group
    ? `${currentModule.group} / ${currentModule.title || currentModule.label}`
    : currentModule?.title || currentModule?.label || 'LivestockTrack'
  const commands = useMemo(
    () =>
      visibleModules.map((module) => ({
        id: module.id,
        label: module.title || module.label,
        group: module.group || 'Workspace',
        icon: ICONS[module.icon],
        path: module.path,
        keywords: [module.label, module.title, module.group].filter(Boolean).join(' '),
      })),
    [visibleModules]
  )

  useEffect(() => {
    if (!currentModule?.group) return
    setCollapsedGroups((current) => {
      if (!current.has(currentModule.group)) return current
      const next = new Set(current)
      next.delete(currentModule.group)
      return next
    })
  }, [currentModule?.group])

  useEffect(() => {
    function handleKeyDown(event) {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
      if (!isShortcut) return
      event.preventDefault()
      setCommandOpen((value) => !value)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function handleWorkspaceChange(event) {
    await switchOrganization(event.target.value)
  }

  function toggleGroup(group) {
    setCollapsedGroups((current) => {
      const next = new Set(current)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  function handleCommandSelect(command) {
    navigate(command.path)
  }

  const syncBadge = syncBadgeDetails(syncState, pendingWrites)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus-ring fixed left-3 top-3 z-[90] rounded-lg px-4 py-2"
        style={{ background: 'var(--surface)', color: 'var(--accent-ink)', border: '1px solid var(--border)' }}
      >
        Skip to main content
      </a>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'var(--overlay)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 w-[min(88vw,16rem)] md:w-64 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg overflow-hidden"
              style={{ background: 'var(--accent-bg)' }}
            >
              {farmLogo ? (
                <img src={farmLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span aria-hidden>{ICONS[animalTypeDetails.icon] || animalTypeDetails.emoji || ICONS.Package}</span>
              )}
            </div>
            <div className="min-w-0">
              <p
                style={{ margin: 0, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={farmName}
              >
                {farmName}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
                LivestockTrack
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Tenant
            </p>
            <p style={{ margin: '4px 0 0', color: 'var(--text)', fontWeight: 600 }}>
              {currentOrganization?.plan || 'Getting started'}
            </p>
            <div className="mt-2">
              <Badge variant={syncBadge.variant}>
                <span
                  aria-hidden
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ background: syncBadge.dot }}
                />
                {syncBadge.label}
              </Badge>
            </div>
          </div>

          {memberships.length > 1 && (
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
                Workspace
              </label>
              <select className="input-field !py-2" value={currentOrganization?.id || ''} onChange={handleWorkspaceChange}>
                {memberships.map((membership) => (
                  <option key={membership.id} value={membership.organization_id}>
                    {membership.organization?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isPlatformOwner && (
            <button type="button" onClick={() => navigate('/platform')} className="btn-secondary w-full">
              Platform Admin
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {ungroupedModules.length > 0 && (
            <div className="space-y-1">
              {ungroupedModules.map((module) => (
                <SidebarLink key={module.id} module={module} onSelect={() => setSidebarOpen(false)} />
              ))}
            </div>
          )}

          {groupedModules.map(({ group, modules }) => (
            <section key={group} className="space-y-1">
              <button
                type="button"
                className="focus-ring flex w-full items-center justify-between rounded-lg px-3 py-2 text-left"
                aria-expanded={!collapsedGroups.has(group)}
                onClick={() => toggleGroup(group)}
                style={{
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  fontWeight: 700,
                }}
              >
                <span>{group}</span>
                <span aria-hidden>{collapsedGroups.has(group) ? '+' : '-'}</span>
              </button>
              {!collapsedGroups.has(group) && modules.map((module) => (
                <SidebarLink key={module.id} module={module} onSelect={() => setSidebarOpen(false)} />
              ))}
            </section>
          ))}
        </nav>

        <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          {isImpersonating && (
            <button onClick={stopImpersonation} className="btn-secondary w-full">
              Exit Impersonation
            </button>
          )}
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{user?.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
              {currentRoleDefinition?.name || currentRole || 'No role assigned'}
            </p>
          </div>
          <button onClick={logout} className="btn-secondary w-full">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-h-screen flex flex-col md:ml-64">
        <CommandPalette
          commands={commands}
          open={commandOpen}
          onClose={() => setCommandOpen(false)}
          onSelect={handleCommandSelect}
        />
        <header
          className="sticky top-0 z-30 border-b"
          style={{ background: 'var(--header-bg)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}
        >
          {isImpersonating && (
            <div
              className="px-4 sm:px-6 py-2 text-sm"
              style={{ background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))', color: 'var(--text)' }}
            >
              Support impersonation active for {currentOrganization?.name}. Changes here affect this farm workspace directly.
            </div>
          )}
          <div className="h-16 flex items-center px-4 sm:px-6 gap-3">
            <IconButton
              label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden"
              onClick={() => setSidebarOpen((value) => !value)}
            >
              ☰
            </IconButton>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {breadcrumbs}
              </p>
              <h1 style={{ margin: 0, fontSize: '18px', color: 'var(--text)', fontWeight: 700 }}>
                {currentModule?.title || 'LivestockTrack'}
              </h1>
            </div>
            <button
              type="button"
              className="focus-ring hidden items-center gap-2 rounded-lg px-3 py-2 text-sm lg:flex"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                minWidth: '220px',
              }}
              onClick={() => setCommandOpen(true)}
            >
              <span>Search pages</span>
              <span
                className="ml-auto rounded px-1.5 py-0.5 text-[11px]"
                style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}
              >
                Ctrl K
              </span>
            </button>
            <div className="hidden sm:block">
              <Badge variant={syncBadge.variant}>
                <span
                  aria-hidden
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ background: syncBadge.dot }}
                />
                {syncBadge.label}
              </Badge>
            </div>
            {canInstall && (
              <button type="button" className="btn-secondary hidden sm:inline-flex text-sm" onClick={promptInstall}>
                Install app
              </button>
            )}
            <AnimalTypeSwitcher />
            <ThemeSwitcher />
            <CurrencySwitcher />
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6"
          style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
        >
          {lastError && (
            <div
              className="mb-4 rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-3"
              style={{
                background: 'color-mix(in srgb, #ef4444 12%, var(--surface))',
                color: 'var(--text)',
                border: '1px solid color-mix(in srgb, #ef4444 28%, var(--border))',
              }}
            >
              <span>{lastError}</span>
              <button type="button" className="btn-secondary text-xs" onClick={clearSyncError}>
                Dismiss
              </button>
            </div>
          )}
          {canInstall && (
            <button type="button" className="btn-primary mb-4 w-full sm:hidden" onClick={promptInstall}>
              Install app
            </button>
          )}
          <Suspense
            fallback={
              <Skeleton count={2} />
            }
          >
            <Outlet />
          </Suspense>
        </main>

        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(visibleModules.length, 4)}, minmax(0, 1fr))`,
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            boxShadow: '0 -2px 16px rgba(0,0,0,.08)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {visibleModules.slice(0, 4).map((module) => (
            <NavLink
              key={module.id}
              to={module.path}
              className="focus-ring flex flex-col items-center justify-center py-2 text-xs"
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent-ink)' : 'var(--text-dim)',
                borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              })}
            >
              <span style={{ fontSize: '18px' }}>{ICONS[module.icon] || '•'}</span>
              <span>{module.label.length > 9 ? `${module.label.slice(0, 9)}…` : module.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
