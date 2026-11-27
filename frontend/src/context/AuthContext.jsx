import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('rso_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('rso_token')
    if (token && !user) {
      authApi.me()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('rso_token')
          localStorage.removeItem('rso_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password)
    const { access_token, user: userData } = res.data
    localStorage.setItem('rso_token', access_token)
    localStorage.setItem('rso_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('rso_token')
    localStorage.removeItem('rso_user')
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'DEPT_ADMIN'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
