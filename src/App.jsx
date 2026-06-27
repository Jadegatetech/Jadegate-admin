import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Conversions from './pages/Conversions'
import PendingConversions from './pages/PendingConversions'
import ExchangeRate from './pages/ExchangeRate'
import Agents from './pages/Agents'
import AuditLogs from './pages/AuditLogs'
import Chat from './pages/Chat'
import ReportedMessages from './pages/ReportedMessages'
import ReconciliationRuns from './pages/ReconciliationRuns'
import ReconciliationRunDetail from './pages/ReconciliationRunDetail'
import ReconciliationMismatches from './pages/ReconciliationMismatches'
import Notifications from './pages/Notifications'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="conversions" element={<Conversions />} />
            <Route path="conversions/pending" element={<PendingConversions />} />
            <Route path="exchange-rate" element={<ExchangeRate />} />
            <Route path="agents" element={<Agents />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="chat" element={<Chat />} />
            <Route path="reported-messages" element={<ReportedMessages />} />
            <Route path="reconciliation" element={<ReconciliationRuns />} />
            <Route path="reconciliation/runs/:runId" element={<ReconciliationRunDetail />} />
            <Route path="reconciliation/runs/:runId/mismatches" element={<ReconciliationMismatches />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
