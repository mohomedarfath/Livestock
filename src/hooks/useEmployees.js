import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { employeeRepository } from '../services/repositories/employeeRepository'

export function useEmployees() {
  const { currentOrganization } = useTenant()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextEmployees = await employeeRepository.list(currentOrganization?.id)
      setEmployees(nextEmployees)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load employees.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createEmployee(employee) {
    const created = await employeeRepository.create(currentOrganization?.id, employee)
    setEmployees((current) => [...current, created])
    return created
  }

  async function toggleEmployeeActive(employeeId) {
    await employeeRepository.toggleActive(currentOrganization?.id, employeeId)
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === employeeId ? { ...employee, active: !employee.active } : employee
      )
    )
  }

  async function removeEmployee(employeeId) {
    await employeeRepository.remove(currentOrganization?.id, employeeId)
    setEmployees((current) => current.filter((employee) => employee.id !== employeeId))
  }

  return { employees, loading, error, reload, createEmployee, toggleEmployeeActive, removeEmployee }
}
