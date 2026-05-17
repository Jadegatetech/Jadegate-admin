import axios from 'axios'
import toast from 'react-hot-toast'
import { SERVICE_UNAVAILABLE_MESSAGE, isServiceUnavailable } from './errors'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const sessionId = localStorage.getItem('sessionId')
  if (sessionId) {
    config.headers['x-session-id'] = sessionId
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const clearStoredSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('sessionId')
}

const persistSessionTokens = (data) => {
  const payload = data?.data ?? data
  const newAccessToken = data?.token ?? data?.accessToken ?? payload?.token ?? payload?.accessToken
  const newRefreshToken = data?.refreshToken ?? payload?.refreshToken
  const newSessionId = data?.sessionId ?? payload?.sessionId

  if (!newAccessToken) {
    throw new Error('Refresh response did not include an access token')
  }

  localStorage.setItem('accessToken', newAccessToken)
  if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken)
  if (newSessionId) localStorage.setItem('sessionId', newSessionId)

  api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
  const latestSessionId = newSessionId ?? localStorage.getItem('sessionId')
  if (latestSessionId) {
    api.defaults.headers.common['x-session-id'] = latestSessionId
  }

  return { newAccessToken, latestSessionId }
}

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// On 401: refresh token, retry original request; if refresh fails, logout except on 503.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (isServiceUnavailable(error)) {
      toast.error(SERVICE_UNAVAILABLE_MESSAGE, { id: 'service-unavailable' })
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      const sessionId = localStorage.getItem('sessionId')

      if (!refreshToken || !sessionId) {
        isRefreshing = false
        clearStoredSession()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken, sessionId },
          { headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId } },
        )
        const { newAccessToken, latestSessionId } = persistSessionTokens(data)
        window.dispatchEvent(new CustomEvent('token-refreshed'))
        processQueue(null, newAccessToken)

        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        if (latestSessionId) originalRequest.headers['x-session-id'] = latestSessionId
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        if (!isServiceUnavailable(refreshError)) {
          clearStoredSession()
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
