import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/auth/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let unsubscribe = () => {}

    async function bootstrap() {
      const initialUser = await authService.getCurrentUser()
      if (isMounted) {
        setUser(initialUser)
        setLoading(false)
      }

      unsubscribe = await authService.onAuthStateChange((nextUser) => {
        if (isMounted) setUser(nextUser)
      })
    }

    bootstrap()

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  async function login(email, password) {
    const result = await authService.login(email, password)
    if (result.success) setUser(result.user)
    return result
  }

  async function signup(payload) {
    const result = await authService.signup(payload)
    if (result.success && result.user) setUser(result.user)
    return result
  }

  async function signInWithGoogle() {
    const result = await authService.signInWithGoogle()
    if (result.success && result.user) setUser(result.user)
    return result
  }

  async function resetPassword(email) {
    return authService.resetPassword(email)
  }

  async function updatePassword(password) {
    const result = await authService.updatePassword(password)
    if (result.success && result.user) setUser(result.user)
    return result
  }

  async function completePasswordReset(oobCode, password) {
    return authService.completePasswordReset(oobCode, password)
  }

  async function logout() {
    await authService.logout()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      authMode: authService.mode,
      login,
      signup,
      signInWithGoogle,
      resetPassword,
      updatePassword,
      completePasswordReset,
      logout,
      isPlatformOwner: () => user?.platformRole === 'super_admin',
      isAdmin: () => user?.role === 'admin',
      isManager: () => user?.role === 'admin' || user?.role === 'manager',
      isAccountant: () => user?.role === 'admin' || user?.role === 'accountant',
      hasRole: (role) => user?.role === role,
    }),
    [loading, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
