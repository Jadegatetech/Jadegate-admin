import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getConversions, markConversionComplete, markConversionFailed } from '../api/conversions'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import { SkeletonTable } from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import ConversionDetailModal from '../components/conversions/ConversionDetailModal'
import ActionModal from '../components/conversions/ActionModal'

const STATUSES = ['all', 'pending', 'completed', 'failed', 'cancelled']

const formatNGN = (kobo) => {
  if (!kobo && kobo !== 0) return '—'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100)
}

const formatRMB = (val) => {
  if (!val && val !== 0) return '—'
  return `¥${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(val)}`
}

export default function Conversions() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedConversion, setSelectedConversion] = useState(null)
  const [actionState, setActionState] = useState({ conversion: null, type: null })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['conversions', statusFilter, page],
    queryFn: () => getConversions({
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      page,
      limit: 20,
    }),
    select: (res) => res.data,
    placeholderData: (prev) => prev,
  })

  const conversions = data?.data ?? []
  const pagination = data?.pagination ?? {}

  const completeMutation = useMutation({
    mutationFn: ({ id, note }) => markConversionComplete(id, note),
    onSuccess: () => {
      toast.success('Conversion marked as completed')
      queryClient.invalidateQueries({ queryKey: ['conversions'] })
      queryClient.invalidateQueries({ queryKey: ['pendingConversions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setActionState({ conversion: null, type: null })
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Action failed'),
  })

  const failMutation = useMutation({
    mutationFn: ({ id, note }) => markConversionFailed(id, note),
    onSuccess: () => {
      toast.success('Conversion marked as failed — wallet refunded')
      queryClient.invalidateQueries({ queryKey: ['conversions'] })
      queryClient.invalidateQueries({ queryKey: ['pendingConversions'] })
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
      <div>
        <h1 className="text-2xl font-bold text-jade-50 tracking-tight">All Conversions</h1>
        <p className="text-jade-warm/60 text-sm mt-1">Browse and manage all conversion transactions</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 bg-jade-800/80 rounded-xl w-fit flex-wrap border border-jade-700/15">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium capitalize transition-all ${
              statusFilter === s
                ? 'bg-jade-400 text-jade-900 shadow-sm shadow-jade-400/20'
                : 'text-jade-warm/70 hover:text-jade-50 hover:bg-jade-700/15'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-jade-800 border border-jade-700/20 rounded-2xl overflow-hidden">
        {isError ? (
          <ErrorState message="Failed to load conversions" onRetry={refetch} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-jade-700/25">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">NGN</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">RMB</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">Rate</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">Method</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-jade-warm/60 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonTable rows={8} cols={8} />
                  ) : conversions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-jade-700/60">
                        No conversions found
                      </td>
                    </tr>
                  ) : (
                    conversions.map((c) => (
                      <tr
                        key={c._id}
                        onClick={() => setSelectedConversion(c)}
                        className="border-b border-jade-700/15 hover:bg-jade-700/10 cursor-pointer transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-sm font-medium text-jade-50">{c.user?.fullName ?? '—'}</p>
                            <p className="text-xs text-jade-700/70">{c.user?.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-jade-50 font-medium whitespace-nowrap">{formatNGN(c.amountNGN)}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-50/80 whitespace-nowrap">{formatRMB(c.amountRMB)}</td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/60">{c.rateUsed ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <Badge
                            status={c.receivingMethod}
                            label={c.receivingMethod === 'chinese_bank' ? 'Chinese Bank' : 'Alipay'}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge status={c.status} />
                        </td>
                        <td className="px-5 py-3.5 text-sm text-jade-warm/60 whitespace-nowrap">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          {c.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setActionState({ conversion: c, type: 'complete' })}
                                className="px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs font-medium rounded-lg transition-all"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => setActionState({ conversion: c, type: 'fail' })}
                                className="px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium rounded-lg transition-all"
                              >
                                Fail
                              </button>
                            </div>
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
