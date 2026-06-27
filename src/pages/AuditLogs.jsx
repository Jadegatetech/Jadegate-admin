import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '../api/auditLogs'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { SkeletonTable } from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'

const ACTION_COLORS = {
  CREATE: 'text-green-400 bg-green-400/10',
  UPDATE: 'text-blue-400 bg-blue-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
  COMPLETE: 'text-green-400 bg-green-400/10',
  FAIL: 'text-red-400 bg-red-400/10',
  LOGIN: 'text-jade-400 bg-jade-400/10',
  SET_RATE: 'text-purple-400 bg-purple-400/10',
}

const getActionStyle = (action) => {
  if (!action) return 'text-jade-700 bg-jade-700/10'
  const upper = action.toUpperCase()
  for (const key of Object.keys(ACTION_COLORS)) {
    if (upper.includes(key)) return ACTION_COLORS[key]
  }
  return 'text-jade-700 bg-jade-700/10'
}

export default function AuditLogs() {
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['auditLogs', page],
    queryFn: () => getAuditLogs({ page, limit: 20 }),
    select: (res) => res.data,
  })

  const logs = data?.data ?? []
  const pagination = data?.pagination ?? {}

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Immutable record of all admin actions</p>
        </div>
      </div>

      <div className="table-shell">
        {isError ? <ErrorState message="Failed to load audit logs" onRetry={refetch} /> : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr>
                  <th>Admin</th><th>Action</th><th>Resource</th>
                  <th>Resource ID</th><th>IP Address</th><th>Date</th>
                  <th className="text-right">Details</th>
                </tr></thead>
                <tbody>
                  {isLoading ? <SkeletonTable rows={8} cols={7} /> : logs.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState title="No audit logs found" message="Admin actions will be recorded here." /></td></tr>
                  ) : logs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-jade-50">{log.adminId?.fullName ?? '—'}</p>
                          <p className="text-xs text-jade-700/70">@{log.adminId?.username}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${getActionStyle(log.action)}`}>{log.action ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-jade-50/70">{log.resourceType ?? '—'}</td>
                      <td className="px-5 py-3.5"><p className="text-xs font-mono text-jade-warm/50 truncate max-w-[120px]">{log.resourceId ?? '—'}</p></td>
                      <td className="px-5 py-3.5 text-sm text-jade-warm/50 font-mono">{log.ipAddress ?? '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-jade-warm/60 whitespace-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
                      <td className="px-5 py-3.5 text-right">
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <button onClick={() => setSelectedLog(log)} className="btn btn-sm btn-secondary text-jade-400">View changes</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onPage={(p) => setPage(p)} />
          </>
        )}
      </div>

      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Audit Log Details" size="lg">
        {selectedLog && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 bg-jade-900/60 rounded-xl border border-jade-700/10">
                <p className="text-jade-700/60 text-[11px] uppercase tracking-wider mb-1.5">Admin</p>
                <p className="text-jade-50 font-medium">{selectedLog.adminId?.fullName}</p>
                <p className="text-jade-700/60 text-xs">@{selectedLog.adminId?.username}</p>
              </div>
              <div className="p-3.5 bg-jade-900/60 rounded-xl border border-jade-700/10">
                <p className="text-jade-700/60 text-[11px] uppercase tracking-wider mb-1.5">Action</p>
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${getActionStyle(selectedLog.action)}`}>{selectedLog.action}</span>
              </div>
              <div className="p-3.5 bg-jade-900/60 rounded-xl border border-jade-700/10">
                <p className="text-jade-700/60 text-[11px] uppercase tracking-wider mb-1.5">Resource</p>
                <p className="text-jade-50">{selectedLog.resourceType}</p>
                <p className="text-jade-700/60 text-xs font-mono">{selectedLog.resourceId}</p>
              </div>
              <div className="p-3.5 bg-jade-900/60 rounded-xl border border-jade-700/10">
                <p className="text-jade-700/60 text-[11px] uppercase tracking-wider mb-1.5">IP Address</p>
                <p className="text-jade-50 font-mono">{selectedLog.ipAddress ?? '—'}</p>
              </div>
              {selectedLog.targetUserId && (
                <div className="p-3.5 bg-jade-900/60 rounded-xl border border-jade-700/10 col-span-2">
                  <p className="text-jade-700/60 text-[11px] uppercase tracking-wider mb-1.5">Target User ID</p>
                  <p className="text-jade-50 font-mono text-xs">{selectedLog.targetUserId}</p>
                </div>
              )}
            </div>
            {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">Changes</p>
                <pre className="bg-jade-900/60 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto border border-jade-700/10">{JSON.stringify(selectedLog.changes, null, 2)}</pre>
              </div>
            )}
            {selectedLog.userAgent && (
              <div>
                <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">User Agent</p>
                <p className="text-xs text-jade-warm/60 bg-jade-900/60 rounded-xl p-3.5 break-all border border-jade-700/10">{selectedLog.userAgent}</p>
              </div>
            )}
            <p className="text-xs text-jade-700/50">Logged at {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : '—'}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
