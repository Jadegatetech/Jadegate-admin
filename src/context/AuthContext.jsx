import { useState, useEffect, useCallback } from 'react'
import { login as loginApi, logout as logoutApi, getMe } from '../api/auth'
import toast from 'react-hot-toast'
import AuthContext from './AuthContextValue'
import { getApiErrorMessage, isServiceUnavailable } from '../api/errors'

const clearStoredSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('sessionId')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('accessToken')))
  const [authUnavailable, setAuthUnavailable] = useState(false)

  const applySessionResponse = useCallback((data) => {
    const userData = data.data
    if (data.success && userData?._id && userData.role === 'admin') {
      setUser(userData)
      setAuthUnavailable(false)
    } else {
      clearStoredSession()
    }
  }, [])

  const handleSessionRestoreError = useCallback((err) => {
    if (isServiceUnavailable(err)) {
      setAuthUnavailable(true)
      toast.error(getApiErrorMessage(err))
      return
    }
    clearStoredSession()
  }, [])

  const restoreSession = useCallback(() => {
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) return
    setLoading(true)
    getMe()
      .then(({ data }) => applySessionResponse(data))
      .catch(handleSessionRestoreError)
      .finally(() => setLoading(false))
  }, [applySessionResponse, handleSessionRestoreError])

  // On mount, try to restore session from stored tokens
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) return
    getMe()
      .then(({ data }) => applySessionResponse(data))
      .catch(handleSessionRestoreError)
      .finally(() => setLoading(false))
  }, [applySessionResponse, handleSessionRestoreError])

  const login = useCallback(async (email, password) => {
    const { data } = await loginApi(email, password)
    if (!data.success) throw new Error('Login failed')

    const userData = data.data
    const accessToken = data.token ?? data.accessToken
    const refreshToken = data.refreshToken

    if (!accessToken || !userData) throw new Error('Login failed')
    if (userData.role !== 'admin') {
      throw new Error('Access denied. Admins only.')
    }

    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    if (data.sessionId) localStorage.setItem('sessionId', data.sessionId)
    setAuthUnavailable(false)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // ignore errors on logout
    }
    clearStoredSession()
    setUser(null)
    setAuthUnavailable(false)
    toast.success('Logged out successfully')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        authUnavailable,
        retrySessionRestore: restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
