import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { SERVICE_UNAVAILABLE_MESSAGE } from '../api/errors'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, authUnavailable, retrySessionRestore } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-jade-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-jade-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-jade-700 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (authUnavailable) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-jade-900 px-4">
        <div className="surface-card max-w-md text-center">
          <div className="w-12 h-12 rounded-2xl bg-jade-400/10 border border-jade-400/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-jade-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-jade-50">Service unavailable</h1>
          <p className="text-sm text-jade-warm/70 mt-2">{SERVICE_UNAVAILABLE_MESSAGE}</p>
          <button onClick={retrySessionRestore} className="btn btn-primary mt-5">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
