import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getReconciliationRun } from '../api/reconciliation'
import { getApiErrorMessage } from '../api/errors'
import Badge from '../components/ui/Badge'
import ErrorState from '../components/ui/ErrorState'
import { SkeletonCard } from '../components/ui/Skeleton'

const formatDate = (value) => value ? new Date(value).toLocaleString() : '—'

const Row = ({ label, value }) => (
  <div className="flex gap-4 py-2.5 border-b border-jade-700/15 last:border-0">
    <dt className="text-sm text-jade-warm/60 w-44 shrink-0">{label}</dt>
    <dd className="text-sm text-jade-50 font-medium break-all">{value ?? '—'}</dd>
  </div>
)

const SeverityCard = ({ label, value }) => (
  <div className="rounded-lg border border-jade-700/18 bg-jade-900/45 p-4">
    <p className="text-xs text-jade-warm/60 capitalize">{label}</p>
    <p className="text-2xl font-black text-jade-50 mt-1">{value ?? 0}</p>
  </div>
)

export default function ReconciliationRunDetail() {
  const { runId } = useParams()

  const { data: run, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reconciliationRun', runId],
    queryFn: () => getReconciliationRun(runId),
    select: (res) => res.data?.data,
    refetchInterval: (query) => query.state.data?.status === 'running' ? 10_000 : false,
  })

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Run Detail</h1>
          <p className="page-subtitle">{run?.runRef ?? 'Reconciliation run metadata and summary.'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/reconciliation" className="btn btn-secondary">Back to Runs</Link>
          {run && (
            <Link to={`/reconciliation/runs/${run._id}/mismatches`} className="btn btn-primary">
              View Mismatches
            </Link>
          )}
        </div>
      </div>

      {isError ? (
        <div className="surface-card">
          <ErrorState message={getApiErrorMessage(error, 'Failed to load reconciliation run')} onRetry={refetch} />
        </div>
      ) : isLoading ? (
        <SkeletonCard />
      ) : run ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['critical', 'high', 'medium', 'low'].map((severity) => (
              <SeverityCard key={severity} label={severity} value={run.severitySummary?.[severity]} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
            <div className="surface-card">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge status={run.status} />
                <Badge status={run.runType} label={run.runType} />
                {run.dryRun && <Badge status="pending" label="Dry run" />}
              </div>
              <dl>
                <Row label="Run ref" value={run.runRef} />
                <Row label="Run type" value={run.runType} />
                <Row label="Status" value={run.status} />
                <Row label="Started at" value={formatDate(run.startedAt)} />
                <Row label="Completed at" value={formatDate(run.completedAt)} />
                <Row label="Triggered by" value={run.triggeredBy} />
                <Row label="Dry run" value={run.dryRun ? 'Yes' : 'No'} />
                <Row label="Limit" value={run.limit} />
              </dl>
            </div>

            <div className="surface-card">
              <h2 className="text-sm font-semibold text-jade-50 mb-4">Records</h2>
              <dl>
                <Row label="Total checked" value={run.totalRecordsChecked ?? 0} />
                <Row label="Mismatch count" value={run.mismatchCount ?? 0} />
                <Row label="Notes" value={run.notes} />
                <Row label="Error" value={run.error} />
              </dl>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
