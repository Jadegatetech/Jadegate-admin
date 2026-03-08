import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '../api/auditLogs'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { SkeletonTable } from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'

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
      <div>
        <h1 className="text-2xl font-bold text-jade-50">Audit Logs</h1>
        <p className="text-jade-warm text-sm mt-0.5">Immutable record of all admin actions</p>
      </div>

      <div className="bg-jade-800 border border-jade-700/40 rounded-xl overflow-hidden">
        {isError ? (
          <ErrorState message="Failed to load audit logs" onRetry={refetch} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-jade-700/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Admin</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Resource</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Resource ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-jade-warm uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonTable rows={8} cols={7} />
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-jade-700">No audit logs found</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="border-b border-jade-700/40 hover:bg-jade-700/20 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-jade-50">
                              {log.adminId?.fullName ?? '—'}
                            </p>
                            <p className="text-xs text-jade-700">@{log.adminId?.username}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${getActionStyle(log.action)}`}>
                            {log.action ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-jade-50/80">{log.resourceType ?? '—'}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono text-jade-warm truncate max-w-[120px]">
                            {log.resourceId ?? '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-jade-warm font-mono">{log.ipAddress ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-jade-warm whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-xs text-jade-400 hover:text-jade-500 transition-colors"
                            >
                              View changes
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPage={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-jade-900 rounded-lg">
                <p className="text-jade-700 text-xs mb-1">Admin</p>
                <p className="text-jade-50 font-medium">{selectedLog.adminId?.fullName}</p>
                <p className="text-jade-700 text-xs">@{selectedLog.adminId?.username}</p>
              </div>
              <div className="p-3 bg-jade-900 rounded-lg">
                <p className="text-jade-700 text-xs mb-1">Action</p>
                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${getActionStyle(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>
              <div className="p-3 bg-jade-900 rounded-lg">
                <p className="text-jade-700 text-xs mb-1">Resource</p>
                <p className="text-jade-50">{selectedLog.resourceType}</p>
                <p className="text-jade-700 text-xs font-mono">{selectedLog.resourceId}</p>
              </div>
              <div className="p-3 bg-jade-900 rounded-lg">
                <p className="text-jade-700 text-xs mb-1">IP Address</p>
                <p className="text-jade-50 font-mono">{selectedLog.ipAddress ?? '—'}</p>
              </div>
              {selectedLog.targetUserId && (
                <div className="p-3 bg-jade-900 rounded-lg col-span-2">
                  <p className="text-jade-700 text-xs mb-1">Target User ID</p>
                  <p className="text-jade-50 font-mono text-xs">{selectedLog.targetUserId}</p>
                </div>
              )}
            </div>

            {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-jade-700 uppercase tracking-wider mb-2">Changes</p>
                <pre className="bg-jade-900 rounded-lg p-4 text-xs text-green-400 font-mono overflow-x-auto">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.userAgent && (
              <div>
                <p className="text-xs font-semibold text-jade-700 uppercase tracking-wider mb-2">User Agent</p>
                <p className="text-xs text-jade-warm bg-jade-900 rounded-lg p-3 break-all">{selectedLog.userAgent}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-jade-700">
                Logged at {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
