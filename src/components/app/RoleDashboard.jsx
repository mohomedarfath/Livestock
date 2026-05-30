import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'
import AdminDashboard from '../../pages/admin/AdminDashboard'
import ManagerDashboard from '../../pages/manager/ManagerDashboard'
import EmployeeDashboard from '../../pages/employee/EmployeeDashboard'
import AccountantDashboard from '../../pages/accountant/AccountantDashboard'
import ShopDashboard from '../../pages/shop/ShopDashboard'
import { MODULE_PATH_BY_ID } from '../../app/modules'
import { useWorkspaceMode } from '../../workspace/WorkspaceModeContext'

export default function RoleDashboard() {
  const navigate = useNavigate()
  const { effectiveDashboardRole } = useTenant()
  const { workspaceMode } = useWorkspaceMode()

  const onNavigate = (id) => navigate(MODULE_PATH_BY_ID[id] || '/app')

  if (workspaceMode === 'shop') return <ShopDashboard onNavigate={onNavigate} />
  if (effectiveDashboardRole === 'manager') return <ManagerDashboard onNavigate={onNavigate} />
  if (effectiveDashboardRole === 'employee') return <EmployeeDashboard onNavigate={onNavigate} />
  if (effectiveDashboardRole === 'accountant') return <AccountantDashboard onNavigate={onNavigate} />
  return <AdminDashboard onNavigate={onNavigate} />
}
