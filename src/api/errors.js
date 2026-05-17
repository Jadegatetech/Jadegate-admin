export const SERVICE_UNAVAILABLE_MESSAGE =
  'Authentication service temporarily unavailable. Your session was not cleared. Please retry shortly.'

export const isServiceUnavailable = (error) => error?.response?.status === 503

export const isAuthError = (error) => [401, 403].includes(error?.response?.status)

export const getApiErrorMessage = (error, fallback = 'Action failed') => {
  if (isServiceUnavailable(error)) return SERVICE_UNAVAILABLE_MESSAGE
  if (error?.code === 'ECONNABORTED') return 'Request timed out. Please retry.'
  if (!error?.response && error?.message === 'Network Error') {
    return 'Network error. Please check the connection and retry.'
  }
  return error?.response?.data?.message ?? fallback
}
