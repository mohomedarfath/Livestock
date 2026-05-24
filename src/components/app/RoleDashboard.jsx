import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'
import AdminDashboard from '../../pages/admin/AdminDashboard'
import ManagerDashboard from '../../pages/manager/ManagerDashboard'
import EmployeeDashboard from '../../pages/employee/EmployeeDashboard'
import AccountantDashboard from '../../pages/accountant/AccountantDashboard'
import { MODULE_PATH_BY_ID } from '../../app/modules'

export default function RoleDashboard() {
  const navigate = useNavigate()
  const { effectiveDashboardRole } = useTenant()

  const onNavigate = (id) => navigate(MODULE_PATH_BY_ID[id] || '/app')

  if (effectiveDashboardRole === 'manager') return <ManagerDashboard onNavigate={onNavigate} />
  if (effectiveDashboardRole === 'employee') return <EmployeeDashboard onNavigate={onNavigate} />
  if (effectiveDashboardRole === 'accountant') return <AccountantDashboard onNavigate={onNavigate} />
  return <AdminDashboard onNavigate={onNavigate} />
}
