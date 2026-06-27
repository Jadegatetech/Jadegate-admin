import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getReports,
  updateReportStatus,
  removeReportedMessage,
  REPORT_REASONS,
  REPORT_STATUS_FILTERS,
  REASON_LABELS,
  MODERATION_STATUS_LABELS,
} from '../api/reports'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import { SkeletonTable } from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import ReportDetailModal from '../components/reports/ReportDetailModal'
import ReportActionModal from '../components/reports/ReportActionModal'

const STATUS_TABS = ['all', ...REPORT_STATUS_FILTERS]

const shortId = (id) => {
  if (!id) return '—'
  const s = String(id)
  return s.length > 6 ? `…${s.slice(-6)}` : s
}

const apiError = (err, fallback) => err?.response?.data?.message ?? fallback

export default function ReportedMessages() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState(null)
  const [actionState, setActionState] = useState({ report: null, type: null })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', statusFilter, reasonFilter, search, page],
    queryFn: () => getReports({
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(reasonFilter !== 'all' ? { reason: reasonFilter } : {}),
      ...(search ? { search } : {}),
      page,
      limit: 20,
    }),
    select: (res) => res.data,
    placeholderData: (prev) => prev,
  })

  const reports = data?.data ?? []
  const pagination = data?.pagination ?? {}

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reports'] })
    queryClient.invalidateQueries({ queryKey: ['reportsPending'] })
    if (actionState.report?._id) {
      queryClient.invalidateQueries({ queryKey: ['report', actionState.report._id] })
    }
  }

  const closeAction = () => setActionState({ report: null, type: null })

  const dismissMutation = useMutation({
    mutationFn: ({ id, adminNote }) => updateReportStatus(id, { status: 'dismissed', adminNote: adminNote || undefined }),
    onSuccess: () => { toast.success('Report dismissed'); invalidate(); closeAction() },
    onError: (err) => toast.error(apiError(err, 'Failed to dismiss report')),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, adminNote }) => updateReportStatus(id, { status: 'reviewed', adminNote: adminNote || undefined }),
    onSuccess: () => { toast.success('Report marked resolved'); invalidate(); closeAction() },
    onError: (err) => toast.error(apiError(err, 'Failed to update report')),
  })

  const removeMutation = useMutation({
    mutationFn: async ({ report, adminNote, applyToAll }) => {
      const reason = adminNote || 'Removed by administrator'
      await removeReportedMessage(report.messageId, reason)
      return updateReportStatus(report._id, {
        status: 'actioned',
        adminNote: adminNote || 'Message removed by admin.',
        applyToAllReportsForMessage: applyToAll,
      })
    },
    onSuccess: () => { toast.success('Message removed — report actioned'); invalidate(); closeAction() },
    onError: (err) => toast.error(apiError(err, 'Failed to remove message')),
  })

  const isActing = dismissMutation.isPending || resolveMutation.isPending || removeMutation.isPending

  const handleAction = (type, report) => {
    setDetailId(null)
    setActionState({ report, type })
  }

  const handleConfirm = ({ adminNote, applyToAll }) => {
    const { report, type } = actionState
    if (!report) return
    if (type === 'remove') removeMutation.mutate({ report, adminNote, applyToAll })
    else if (type === 'dismiss') dismissMutation.mutate({ id: report._id, adminNote })
    else if (type === 'resolve') resolveMutation.mutate({ id: report._id, adminNote })
  }

  const applyFilter = (fn) => (val) => { fn(val); setPage(1) }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reported Messages</h1>
          <p className="page-subtitle">Review user reports and remove objectionable chat content</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="segmented-control">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => applyFilter(setStatusFilter)(s)}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-semibold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-jade-400 text-jade-900 shadow-sm shadow-jade-400/20'
                  : 'text-jade-warm/70 hover:text-jade-50 hover:bg-jade-700/15'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={reasonFilter}
          onChange={(e) => applyFilter(setReasonFilter)(e.target.value)}
          className="form-field lg:max-w-[200px]"
        >
          <option value="all">All reasons</option>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>{REASON_LABELS[r]}</option>
          ))}
        </select>

        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }}
          className="flex gap-2 lg:ml-auto"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search reporter, user, details…"
            className="form-field lg:w-64"
          />
          <button type="submit" className="btn btn-secondary shrink-0">Search</button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="btn btn-secondary shrink-0"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="table-shell">
        {isError ? (
          <ErrorState message="Failed to load reports" onRetry={refetch} />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Reported User</th>
                    <th>Reporter</th>
                    <th>Reason</th>
                    <th>Details</th>
                    <th>Report Status</th>
                    <th>Message</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonTable rows={8} cols={8} />
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          title="No reports found"
                          message={statusFilter !== 'all' || reasonFilter !== 'all' || search
                            ? 'Try adjusting your filters.'
                            : 'Reported messages will appear here for review.'}
                        />
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => (
                      <tr key={r._id} onClick={() => setDetailId(r._id)} className="cursor-pointer group">
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-mono text-jade-warm/70">R {shortId(r._id)}</p>
                          <p className="text-[11px] font-mono text-jade-700/50">M {shortId(r.messageId)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-jade-50">{r.reportedUser?.fullName ?? r.reportedUser?.username ?? '—'}</p>
                          <p className="text-xs text-jade-700/60">{r.reportedUser?.email}</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/70">
                          {r.reporter?.fullName ?? r.reporter?.username ?? '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge status={r.reason} label={REASON_LABELS[r.reason] ?? r.reason} />
                        </td>
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <p className="text-sm text-jade-warm/60 truncate">{r.details || '—'}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge status={r.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            status={r.messageModerationStatus ?? 'active'}
                            label={MODERATION_STATUS_LABELS[r.messageModerationStatus] ?? r.messageModerationStatus ?? 'Active'}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/60 whitespace-nowrap">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
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

      <ReportDetailModal
        reportId={detailId}
        onClose={() => setDetailId(null)}
        onAction={handleAction}
      />

      <ReportActionModal
        key={`${actionState.report?._id ?? 'none'}-${actionState.type ?? 'none'}`}
        report={actionState.report}
        actionType={actionState.type}
        onConfirm={handleConfirm}
        onClose={closeAction}
        isLoading={isActing}
      />
    </div>
  )
}
