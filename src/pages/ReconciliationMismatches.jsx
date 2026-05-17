import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MISMATCH_TYPES,
  SEVERITIES,
  getReconciliationMismatches,
  getReconciliationRun,
} from '../api/reconciliation'
import { getApiErrorMessage } from '../api/errors'
import Badge from '../components/ui/Badge'
import ErrorState from '../components/ui/ErrorState'
import Pagination from '../components/ui/Pagination'
import { SkeletonTable } from '../components/ui/Skeleton'
import MismatchActionModal from '../components/reconciliation/MismatchActionModal'

const formatDate = (value) => value ? new Date(value).toLocaleString() : '—'

const boolText = (value) => value ? 'Yes' : 'No'

export default function ReconciliationMismatches() {
  const { runId } = useParams()
  const [severity, setSeverity] = useState('all')
  const [mismatchType, setMismatchType] = useState('all')
  const [reviewed, setReviewed] = useState('all')
  const [acceptedException, setAcceptedException] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedMismatch, setSelectedMismatch] = useState(null)

  const { data: run } = useQuery({
    queryKey: ['reconciliationRun', runId],
    queryFn: () => getReconciliationRun(runId),
    select: (res) => res.data?.data,
  })

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reconciliationMismatches', runId, severity, mismatchType, reviewed, page],
    queryFn: () => getReconciliationMismatches(runId, {
      page,
      limit: 20,
      ...(severity !== 'all' ? { severity } : {}),
      ...(mismatchType !== 'all' ? { mismatchType } : {}),
      ...(reviewed !== 'all' ? { reviewed } : {}),
    }),
    select: (res) => res.data,
    placeholderData: (prev) => prev,
  })

  const mismatches = useMemo(() => data?.data ?? [], [data])
  const pagination = data?.pagination ?? {}
  const filteredMismatches = useMemo(() => {
    if (acceptedException === 'all') return mismatches
    return mismatches.filter((m) => String(Boolean(m.acceptedException)) === acceptedException)
  }, [acceptedException, mismatches])

  const updateFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Run Mismatches</h1>
          <p className="page-subtitle">{run?.runRef ?? 'Review reconciliation mismatches and safe remediation actions.'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to={`/reconciliation/runs/${runId}`} className="btn btn-secondary">Run Detail</Link>
          <button onClick={() => refetch()} className="btn btn-secondary">Retry</button>
        </div>
      </div>

      <div className="surface-card">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <select value={severity} onChange={(e) => updateFilter(setSeverity)(e.target.value)} className="form-field">
            <option value="all">All severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={mismatchType} onChange={(e) => updateFilter(setMismatchType)(e.target.value)} className="form-field">
            <option value="all">All mismatch types</option>
            {MISMATCH_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select value={reviewed} onChange={(e) => updateFilter(setReviewed)(e.target.value)} className="form-field">
            <option value="all">All review states</option>
            <option value="true">Reviewed</option>
            <option value="false">Unreviewed</option>
          </select>
          <select value={acceptedException} onChange={(e) => setAcceptedException(e.target.value)} className="form-field">
            <option value="all">All exception states</option>
            <option value="true">Accepted exception</option>
            <option value="false">Not accepted</option>
          </select>
        </div>
        <p className="text-xs text-jade-warm/55 mt-3">
          Accepted-exception filtering is applied to the currently loaded page because the backend route does not expose that query filter.
        </p>
      </div>

      <div className="table-shell">
        {isError ? (
          <ErrorState message={getApiErrorMessage(error, 'Failed to load mismatches')} onRetry={refetch} />
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Collection</th>
                    <th>Record ID</th>
                    <th>Transaction Ref</th>
                    <th>Reviewed</th>
                    <th>Accepted</th>
                    <th>Category</th>
                    <th>Inherited From</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonTable rows={8} cols={11} />
                  ) : filteredMismatches.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-5 py-16 text-center text-jade-700/60">
                        No mismatches found
                      </td>
                    </tr>
                  ) : (
                    filteredMismatches.map((mismatch) => (
                      <tr key={mismatch._id}>
                        <td className="px-5 py-3.5 text-xs text-jade-50 font-mono">{mismatch.mismatchType}</td>
                        <td className="px-5 py-3.5"><Badge status={mismatch.severity} label={mismatch.severity} /></td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/70">{mismatch.affectedCollection}</td>
                        <td className="px-5 py-3.5 text-xs text-jade-warm/70 font-mono">{mismatch.affectedRecordId ?? '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-jade-warm/70 font-mono">{mismatch.transactionRef ?? '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/70">{boolText(mismatch.reviewed)}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/70">{boolText(mismatch.acceptedException)}</td>
                        <td className="px-5 py-3.5 text-xs text-jade-warm/70">{mismatch.exceptionCategory ?? '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-jade-warm/70 font-mono">{mismatch.inheritedFromExceptionId ?? '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/60 whitespace-nowrap">{formatDate(mismatch.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => setSelectedMismatch(mismatch)} className="btn btn-sm btn-secondary">
                            Details
                          </button>
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

      {selectedMismatch && (
        <MismatchActionModal
          key={selectedMismatch._id}
          mismatch={selectedMismatch}
          runId={runId}
          onClose={() => setSelectedMismatch(null)}
        />
      )}
    </div>
  )
}
