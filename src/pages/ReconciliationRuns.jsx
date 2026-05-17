import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  RUN_STATUSES,
  RUN_TYPES,
  getReconciliationRuns,
  startReconciliationRun,
} from '../api/reconciliation'
import { getApiErrorMessage } from '../api/errors'
import Badge from '../components/ui/Badge'
import ErrorState from '../components/ui/ErrorState'
import Pagination from '../components/ui/Pagination'
import { SkeletonTable } from '../components/ui/Skeleton'

const formatDate = (value) => value ? new Date(value).toLocaleString() : '—'

const severityText = (summary = {}) =>
  ['critical', 'high', 'medium', 'low']
    .map((key) => `${key}: ${summary[key] ?? 0}`)
    .join(' / ')

const adminName = (run) => {
  const admin = run.triggeredByAdminId
  if (!admin) return run.triggeredBy ?? '—'
  const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(' ')
  return fullName || admin.username || run.triggeredBy || '—'
}

export default function ReconciliationRuns() {
  const queryClient = useQueryClient()
  const [runType, setRunType] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [notes, setNotes] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reconciliationRuns', runType, status, page],
    queryFn: () => getReconciliationRuns({
      page,
      limit: 20,
      ...(runType !== 'all' ? { runType } : {}),
      ...(status !== 'all' ? { status } : {}),
    }),
    select: (res) => res.data,
    placeholderData: (prev) => prev,
  })

  const runs = data?.data ?? []
  const pagination = data?.pagination ?? {}

  const startRunMutation = useMutation({
    mutationFn: () => startReconciliationRun({ runType: 'full', notes: notes.trim() }),
    onSuccess: (res) => {
      toast.success(`Full reconciliation started: ${res.data?.data?.runRef ?? 'accepted'}`)
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['reconciliationRuns'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to start reconciliation run')),
  })

  const updateFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reconciliation</h1>
          <p className="page-subtitle">Run and review backend financial reconciliation checks.</p>
        </div>
        <button
          onClick={() => startRunMutation.mutate()}
          disabled={startRunMutation.isPending}
          className="btn btn-primary disabled:opacity-50"
        >
          {startRunMutation.isPending ? 'Starting...' : 'Start Full Run'}
        </button>
      </div>

      <div className="surface-card">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Optional run note"
            className="form-field"
          />
          <select value={runType} onChange={(e) => updateFilter(setRunType)(e.target.value)} className="form-field">
            <option value="all">All run types</option>
            {RUN_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => updateFilter(setStatus)(e.target.value)} className="form-field">
            <option value="all">All statuses</option>
            {RUN_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-shell">
        {isError ? (
          <ErrorState message={getApiErrorMessage(error, 'Failed to load reconciliation runs')} onRetry={refetch} />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Run Ref</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Completed</th>
                    <th>Mismatches</th>
                    <th>Severity</th>
                    <th>Dry Run</th>
                    <th>Triggered By</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonTable rows={8} cols={10} />
                  ) : runs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-16 text-center text-jade-700/60">
                        No reconciliation runs found
                      </td>
                    </tr>
                  ) : (
                    runs.map((run) => (
                      <tr key={run._id}>
                        <td className="px-5 py-3.5 text-sm text-jade-50 font-mono whitespace-nowrap">{run.runRef}</td>
                        <td className="px-5 py-3.5"><Badge status={run.runType} label={run.runType} /></td>
                        <td className="px-5 py-3.5"><Badge status={run.status} /></td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/60 whitespace-nowrap">{formatDate(run.startedAt)}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/60 whitespace-nowrap">{formatDate(run.completedAt)}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-50 font-semibold">{run.mismatchCount ?? 0}</td>
                        <td className="px-5 py-3.5 text-xs text-jade-warm/70 whitespace-nowrap">{severityText(run.severitySummary)}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/70">{run.dryRun ? 'Yes' : 'No'}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/70 whitespace-nowrap">{adminName(run)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link to={`/reconciliation/runs/${run._id}`} className="btn btn-sm btn-secondary">
                            View Details
                          </Link>
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
    </div>
  )
}
