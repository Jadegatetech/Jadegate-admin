import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getPendingConversions, markConversionComplete, markConversionFailed } from '../api/conversions'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import { SkeletonTable } from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import ConversionDetailModal from '../components/conversions/ConversionDetailModal'
import ActionModal from '../components/conversions/ActionModal'

const formatNGN = (kobo) => {
  if (!kobo && kobo !== 0) return '—'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100)
}

const formatRMB = (val) => {
  if (!val && val !== 0) return '—'
  return `¥${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(val)}`
}

export default function PendingConversions() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedConversion, setSelectedConversion] = useState(null)
  const [actionState, setActionState] = useState({ conversion: null, type: null })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pendingConversions', page],
    queryFn: () => getPendingConversions({ page, limit: 50 }),
    select: (res) => res.data,
    refetchInterval: 30_000,
  })

  const conversions = data?.data ?? []
  const pagination = data?.pagination ?? {}
  const totalPending = pagination.total ?? 0

  const completeMutation = useMutation({
    mutationFn: ({ id, note }) => markConversionComplete(id, note),
    onSuccess: () => {
      toast.success('Conversion marked as completed')
      queryClient.invalidateQueries({ queryKey: ['pendingConversions'] })
      queryClient.invalidateQueries({ queryKey: ['conversions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setActionState({ conversion: null, type: null })
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Action failed'),
  })

  const failMutation = useMutation({
    mutationFn: ({ id, note }) => markConversionFailed(id, note),
    onSuccess: () => {
      toast.success('Conversion marked as failed — wallet refunded')
      queryClient.invalidateQueries({ queryKey: ['pendingConversions'] })
      queryClient.invalidateQueries({ queryKey: ['conversions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setActionState({ conversion: null, type: null })
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Action failed'),
  })

  const handleAction = (id, note) => {
    if (actionState.type === 'complete') completeMutation.mutate({ id, note })
    else failMutation.mutate({ id, note })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-jade-50 tracking-tight">Pending Conversions</h1>
            {totalPending > 0 && (
              <span className="bg-jade-400 text-jade-900 text-sm font-bold px-2.5 py-1 rounded-full">
                {totalPending}
              </span>
            )}
          </div>
          <p className="text-jade-warm/60 text-sm mt-1">
            Oldest conversions first — review and take action
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3.5 py-2 bg-jade-700/15 hover:bg-jade-700/25 text-jade-50 text-sm rounded-xl transition-all hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Info banner */}
      {!isLoading && totalPending > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-jade-400/8 border border-jade-400/15 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-jade-400/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-jade-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-jade-100/80">
            <span className="font-semibold">{totalPending} conversion{totalPending !== 1 ? 's' : ''}</span> awaiting processing. Auto-refreshes every 30 seconds.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-jade-800 border border-jade-700/20 rounded-2xl overflow-hidden">
        {isError ? (
          <ErrorState message="Failed to load pending conversions" onRetry={refetch} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-jade-700/25">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">NGN Amount</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">RMB Amount</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">Rate</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">Method</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">Submitted</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonTable rows={10} cols={7} />
                  ) : conversions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-green-400/10 border border-green-400/15 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-jade-warm/80 font-medium">All clear!</p>
                          <p className="text-jade-700/60 text-sm">No pending conversions at the moment.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    conversions.map((c) => (
                      <tr
                        key={c._id}
                        onClick={() => setSelectedConversion(c)}
                        className="border-b border-jade-700/15 hover:bg-jade-700/10 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-sm font-medium text-jade-50">{c.user?.fullName ?? '—'}</p>
                            <p className="text-xs text-jade-700/70">{c.user?.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-jade-50 whitespace-nowrap">{formatNGN(c.amountNGN)}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-50/80 whitespace-nowrap">{formatRMB(c.amountRMB)}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/60">{c.rateUsed ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-1">
                            <Badge
                              status={c.receivingMethod}
                              label={c.receivingMethod === 'bank_transfer' ? 'Bank' : 'Alipay'}
                            />
                            {c.receivingMethod === 'alipay' && c.alipayId && (
                              <p className="text-xs text-jade-700/60 font-mono">{c.alipayId}</p>
                            )}
                            {c.receivingMethod === 'bank_transfer' && c.bankCardDisplay && (
                              <p className="text-xs text-jade-700/60 font-mono">{c.bankCardDisplay}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/60 whitespace-nowrap">
                          {c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActionState({ conversion: c, type: 'complete' })}
                              className="px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs font-semibold rounded-lg transition-all"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => setActionState({ conversion: c, type: 'fail' })}
                              className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold rounded-lg transition-all"
                            >
                              Fail
                            </button>
                          </div>
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

      <ConversionDetailModal
        conversion={selectedConversion}
        onClose={() => setSelectedConversion(null)}
      />

      <ActionModal
        conversion={actionState.conversion}
        actionType={actionState.type}
        onConfirm={handleAction}
        onClose={() => setActionState({ conversion: null, type: null })}
        isLoading={completeMutation.isPending || failMutation.isPending}
      />
    </div>
  )
}
