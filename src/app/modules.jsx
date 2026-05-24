import { lazy } from 'react'

const RoleDashboard = lazy(() => import('../components/app/RoleDashboard.jsx'))
const UserManagement = lazy(() => import('../pages/admin/UserManagement.jsx'))
const EmployeeRoster = lazy(() => import('../pages/manager/EmployeeRoster.jsx'))
const EmployeeActivities = lazy(() => import('../pages/manager/EmployeeActivities.jsx'))
const ActivityLog = lazy(() => import('../pages/employee/ActivityLog.jsx'))
const FlockManager = lazy(() => import('../pages/FlockManager.jsx'))
const DailyLogForm = lazy(() => import('../pages/DailyLogForm.jsx'))
const ExpenseTracking = lazy(() => import('../pages/accountant/ExpenseTracking.jsx'))
const BudgetPlanning = lazy(() => import('../pages/accountant/BudgetPlanning.jsx'))
const WageTracking = lazy(() => import('../pages/accountant/WageTracking.jsx'))
const ProfitLossSummary = lazy(() => import('../pages/ProfitLossSummary.jsx'))
const VaccinationReminders = lazy(() => import('../pages/VaccinationReminders.jsx'))
const FeedCostTracker = lazy(() => import('../pages/FeedCostTracker.jsx'))
const FarmInventory = lazy(() => import('../pages/FarmInventory.jsx'))
const SalesLog = lazy(() => import('../pages/SalesLog.jsx'))
const MedicineLog = lazy(() => import('../pages/MedicineLog.jsx'))
const FCRCalculator = lazy(() => import('../pages/FCRCalculator.jsx'))
const SystemSettings = lazy(() => import('../pages/admin/SystemSettings.jsx'))
const ComplianceReport = lazy(() => import('../pages/ComplianceReport.jsx'))
const WhatsAppAlerts = lazy(() => import('../pages/WhatsAppAlerts.jsx'))
const IncubationTracker = lazy(() => import('../pages/IncubationTracker.jsx'))
const VetNotes = lazy(() => import('../pages/VetNotes.jsx'))
const PastureTracker = lazy(() => import('../pages/PastureTracker.jsx'))
const ResourceMonitor = lazy(() => import('../pages/ResourceMonitor.jsx'))
const CowDashboard = lazy(() => import('../pages/cow/CowDashboard.jsx'))
const CowHerdManager = lazy(() => import('../pages/cow/CowHerdManager.jsx'))
const CowMilkLog = lazy(() => import('../pages/cow/CowMilkLog.jsx'))
const MilkPassbook = lazy(() => import('../pages/cow/MilkPassbook.jsx'))
const CowBreedingCalendar = lazy(() => import('../pages/cow/CowBreedingCalendar.jsx'))
const CowHealthLog = lazy(() => import('../pages/cow/CowHealthLog.jsx'))
const CowProfitability = lazy(() => import('../pages/cow/CowProfitability.jsx'))

export const APP_MODULES = [
  {
    id: 'dashboard',
    path: '/app',
    label: 'Dashboard',
    title: 'Dashboard',
    icon: 'Home',
    group: null,
    roles: ['admin', 'manager', 'employee', 'accountant'],
    phase: 1,
    navigationAware: true,
    component: RoleDashboard,
  },
  {
    id: 'flocks',
    path: '/app/flocks',
    label: 'Flocks',
    title: 'Flock Manager',
    icon: 'Bird',
    group: 'Farm Operations',
    roles: ['admin', 'manager', 'employee'],
    phase: 1,
    component: FlockManager,
  },
  {
    id: 'cow-dashboard',
    path: '/app/cow',
    label: 'Cow Dashboard',
    title: 'Cow Dashboard',
    icon: 'Cow',
    group: 'Farm Operations',
    roles: ['admin', 'manager', 'employee', 'accountant'],
    phase: 1,
    component: CowDashboard,
  },
  {
    id: 'cow-herd',
    path: '/app/cow/herd',
    label: 'Cow Profiles',
    title: 'Cow Profiles',
    icon: 'Cow',
    group: 'Farm Operations',
    roles: ['admin', 'manager', 'employee'],
    phase: 1,
    component: CowHerdManager,
  },
  {
    id: 'cow-milk-log',
    path: '/app/cow/milk',
    label: 'Milk Log',
    title: 'Daily Milk Log',
    icon: 'Milk',
    group: 'Farm Operations',
    roles: ['admin', 'manager', 'employee'],
    phase: 1,
    component: CowMilkLog,
  },
  {
    id: 'milk-passbook',
    path: '/app/cow/passbook',
    label: 'Milk Passbook',
    title: 'Milk Payment Passbook',
    icon: 'Milk',
    group: 'Finance',
    roles: ['admin', 'manager', 'accountant'],
    phase: 1,
    component: MilkPassbook,
  },
  {
    id: 'cow-breeding',
    path: '/app/cow/breeding',
    label: 'Breeding',
    title: 'Breeding & Heat Calendar',
    icon: 'HeartPulse',
    group: 'Health & Feed',
    roles: ['admin', 'manager', 'employee'],
    phase: 1,
    component: CowBreedingCalendar,
  },
  {
    id: 'cow-health',
    path: '/app/cow/health',
    label: 'Cow Health',
    title: 'Cow Health & Withdrawal',
    icon: 'Stethoscope',
    group: 'Health & Feed',
    roles: ['admin', 'manager', 'employee'],
    phase: 1,
    component: CowHealthLog,
  },
  {
    id: 'daily-log',
    path: '/app/daily-log',
    label: 'Daily Log',
    title: 'Daily Log',
    icon: 'NotebookPen',
    group: 'Farm Operations',
    roles: ['admin', 'manager', 'employee'],
    phase: 1,
    component: DailyLogForm,
  },
  {
    id: 'activities',
    path: '/app/activities',
    label: 'All Activities',
    title: 'All Activities',
    icon: 'ClipboardList',
    group: 'Farm Operations',
    roles: ['admin', 'manager'],
    phase: 1,
    component: EmployeeActivities,
  },
  {
    id: 'my-activities',
    path: '/app/my-activities',
    label: 'My Activities',
    title: 'My Activities',
    icon: 'PenSquare',
    group: 'Farm Operations',
    roles: ['employee'],
    phase: 1,
    component: ActivityLog,
  },
  {
    id: 'fcr',
    path: '/app/fcr',
    label: 'FCR',
    title: 'FCR Calculator',
    icon: 'Activity',
    group: 'Farm Operations',
    roles: ['admin', 'manager', 'employee'],
    phase: 1,
    component: FCRCalculator,
  },
  {
    id: 'vaccinations',
    path: '/app/vaccinations',
    label: 'Vaccines',
    title: 'Vaccination Reminders',
    icon: 'ShieldPlus',
    group: 'Health & Feed',
    roles: ['admin', 'manager', 'employee'],
    phase: 1,
    component: VaccinationReminders,
  },
  {
    id: 'medicine',
    path: '/app/medicine',
    label: 'Medicine',
    title: 'Medicine Log',
    icon: 'Pill',
    group: 'Health & Feed',
    roles: ['admin', 'manager', 'employee', 'accountant'],
    phase: 1,
    component: MedicineLog,
  },
  {
    id: 'feed',
    path: '/app/feed',
    label: 'Feed Costs',
    title: 'Feed Cost Tracker',
    icon: 'Wheat',
    group: 'Health & Feed',
    roles: ['admin', 'manager', 'employee', 'accountant'],
    phase: 1,
    component: FeedCostTracker,
  },
  {
    id: 'inventory',
    path: '/app/inventory',
    label: 'Farm Inventory',
    title: 'Farm Inventory',
    icon: 'Package',
    group: 'Inventory',
    roles: ['admin', 'manager', 'employee', 'accountant'],
    phase: 1,
    component: FarmInventory,
  },
  {
    id: 'expenses',
    path: '/app/expenses',
    label: 'Expenses',
    title: 'Expense Tracking',
    icon: 'ReceiptText',
    group: 'Finance',
    roles: ['admin', 'accountant'],
    phase: 1,
    component: ExpenseTracking,
  },
  {
    id: 'budgets',
    path: '/app/budgets',
    label: 'Budget Planning',
    title: 'Budget Planning',
    icon: 'ChartNoAxesColumn',
    group: 'Finance',
    roles: ['admin', 'accountant'],
    phase: 1,
    component: BudgetPlanning,
  },
  {
    id: 'wages',
    path: '/app/wages',
    label: 'Wage Tracking',
    title: 'Wage Tracking',
    icon: 'Wallet',
    group: 'Finance',
    roles: ['admin', 'accountant'],
    phase: 1,
    component: WageTracking,
  },
  {
    id: 'financial',
    path: '/app/financial',
    label: 'Financial',
    title: 'Financial Overview',
    icon: 'ChartPie',
    group: 'Finance',
    roles: ['admin', 'manager', 'accountant'],
    phase: 1,
    nav: false,
    component: ProfitLossSummary,
  },
  {
    id: 'sales',
    path: '/app/sales',
    label: 'Sales',
    title: 'Sales Log',
    icon: 'ShoppingCart',
    group: 'Finance',
    roles: ['admin', 'manager', 'accountant'],
    phase: 1,
    component: SalesLog,
  },
  {
    id: 'profit',
    path: '/app/profit',
    label: 'Profit & Loss',
    title: 'Profit & Loss',
    icon: 'BadgeDollarSign',
    group: 'Finance',
    roles: ['admin', 'manager', 'accountant'],
    phase: 1,
    component: ProfitLossSummary,
  },
  {
    id: 'cow-profit',
    path: '/app/cow/profit',
    label: 'Cow Profit',
    title: 'Cow Profitability',
    icon: 'BadgeDollarSign',
    group: 'Finance',
    roles: ['admin', 'manager', 'accountant'],
    phase: 1,
    component: CowProfitability,
  },
  {
    id: 'employees-roster',
    path: '/app/employees',
    label: 'Employees',
    title: 'Employees',
    icon: 'Briefcase',
    group: 'People',
    roles: ['admin', 'manager'],
    phase: 1,
    component: EmployeeRoster,
  },
  {
    id: 'users',
    path: '/app/users',
    label: 'Admin Console',
    title: 'Farm Admin Console',
    icon: 'Users',
    group: 'Administration',
    roles: ['admin'],
    phase: 1,
    component: UserManagement,
  },
  {
    id: 'settings',
    path: '/app/settings',
    label: 'Settings',
    title: 'System Settings',
    icon: 'Settings',
    group: null,
    roles: ['admin'],
    phase: 1,
    component: SystemSettings,
  },
  {
    id: 'compliance',
    path: '/app/labs/compliance',
    label: 'Compliance Report',
    title: 'Compliance Report',
    icon: 'FileText',
    group: 'Administration',
    roles: ['admin', 'accountant'],
    phase: 2,
    component: ComplianceReport,
  },
  {
    id: 'whatsapp',
    path: '/app/labs/whatsapp',
    label: 'WhatsApp Alerts',
    title: 'WhatsApp Alerts',
    icon: 'MessageCircleMore',
    group: 'Farm Operations',
    roles: ['admin', 'manager'],
    phase: 2,
    component: WhatsAppAlerts,
  },
  {
    id: 'incubation',
    path: '/app/labs/incubation',
    label: 'Incubation',
    title: 'Hatchery & Incubation',
    icon: 'EggFried',
    group: 'Farm Operations',
    roles: ['admin', 'manager', 'employee'],
    phase: 2,
    component: IncubationTracker,
  },
  {
    id: 'vet-notes',
    path: '/app/labs/vet-notes',
    label: 'Vet Notes',
    title: 'Vet & Advisor Notes',
    icon: 'Stethoscope',
    group: 'Health & Feed',
    roles: ['admin', 'manager', 'employee'],
    phase: 2,
    component: VetNotes,
  },
  {
    id: 'pasture',
    path: '/app/labs/pasture',
    label: 'Pasture',
    title: 'Pasture & Free-Range',
    icon: 'Trees',
    group: 'Farm Operations',
    roles: ['admin', 'manager', 'employee'],
    phase: 2,
    component: PastureTracker,
  },
  {
    id: 'resources',
    path: '/app/labs/resources',
    label: 'Energy & Water',
    title: 'Energy & Water Monitor',
    icon: 'Zap',
    group: 'Inventory',
    roles: ['admin', 'manager', 'employee', 'accountant'],
    phase: 2,
    component: ResourceMonitor,
  },
]

export const MODULE_BY_ID = Object.fromEntries(APP_MODULES.map((module) => [module.id, module]))
export const MODULE_BY_PATH = Object.fromEntries(APP_MODULES.map((module) => [module.path, module]))
export const MODULE_PATH_BY_ID = Object.fromEntries(APP_MODULES.map((module) => [module.id, module.path]))

export function modulesForRole(role, phase = 1) {
  return APP_MODULES.filter((module) => module.phase <= phase && module.roles.includes(role))
}

export function navigationModulesForRole(role, phase = 1) {
  return modulesForRole(role, phase).filter((module) => module.nav !== false)
}
