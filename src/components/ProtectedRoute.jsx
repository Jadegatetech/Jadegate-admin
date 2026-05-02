import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
