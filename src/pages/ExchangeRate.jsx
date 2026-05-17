import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getActiveRate, setRate, getRateHistory } from '../api/rate'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import { SkeletonTable } from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'

export default function ExchangeRate() {
  const queryClient = useQueryClient()
  const [rateInput, setRateInput] = useState('')
  const [historyPage, setHistoryPage] = useState(1)

  const { data: activeRate, isLoading: rateLoading, isError: rateError, refetch: refetchRate } = useQuery({
    queryKey: ['activeRate'],
    queryFn: () => getActiveRate(),
    select: (res) => res.data?.data,
  })

  const { data: historyData, isLoading: historyLoading, isError: historyError } = useQuery({
    queryKey: ['rateHistory', historyPage],
    queryFn: () => getRateHistory({ page: historyPage, limit: 20 }),
    select: (res) => res.data,
  })

  const history = historyData?.data ?? []
  const pagination = historyData?.pagination ?? {}

  const setRateMutation = useMutation({
    mutationFn: (rate) => setRate(rate),
    onSuccess: (res) => {
      toast.success(`Rate set to 1 RMB = ₦${res.data?.data?.rateNGNtoRMB}`)
      queryClient.invalidateQueries({ queryKey: ['activeRate'] })
      queryClient.invalidateQueries({ queryKey: ['rateHistory'] })
      setRateInput('')
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to set rate'),
  })

  const handleSetRate = (e) => {
    e.preventDefault()
    const val = parseFloat(rateInput)
    if (!val || val <= 0 || val > 1000) {
      toast.error('Rate must be a number between 0 and 1000')
      return
    }
    setRateMutation.mutate(val)
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exchange Rate</h1>
          <p className="page-subtitle">Manage the NGN per RMB rate used for new conversions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Rate Card */}
        <div className="surface-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-jade-50">Active Rate</h2>
            <Badge status="active" label="Live" />
          </div>

          {rateError ? (
            <ErrorState message="Failed to load active rate" onRetry={refetchRate} />
          ) : rateLoading ? (
            <div className="space-y-3">
              <div className="h-14 skeleton-shimmer rounded-xl" />
              <div className="h-4 skeleton-shimmer rounded-lg w-2/3" />
              <div className="h-4 skeleton-shimmer rounded-lg w-1/2" />
            </div>
          ) : activeRate ? (
            <div>
              <div className="flex items-end gap-3 mb-5">
                <span className="text-5xl font-black text-jade-400 tracking-tight">{activeRate.rateNGNtoRMB}</span>
                <div className="pb-1.5">
                  <p className="text-jade-warm/70 text-sm font-medium">NGN per RMB</p>
                  <p className="text-jade-700/60 text-xs">1 RMB = {activeRate.rateNGNtoRMB} NGN</p>
                </div>
              </div>
              <div className="space-y-2.5 pt-4 border-t border-jade-700/20">
                <div className="flex justify-between text-sm">
                  <span className="text-jade-warm/60">Set by</span>
                  <span className="text-jade-50 font-medium">
                    {activeRate.setBy?.fullName ?? activeRate.setBy?.username ?? 'admin'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-jade-warm/60">Set at</span>
                  <span className="text-jade-50/80">
                    {activeRate.createdAt ? new Date(activeRate.createdAt).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-jade-warm/60 text-sm">No active rate set. Set one below.</p>
          )}
        </div>

        {/* Set New Rate Form */}
        <div className="surface-card p-4 sm:p-6">
          <h2 className="text-[15px] font-semibold text-jade-50 mb-2">Set New Rate</h2>
          <p className="text-sm text-jade-warm/60 mb-5">
            Setting a new rate will immediately deactivate the current rate and apply to all new conversions.
          </p>

          <form onSubmit={handleSetRate} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-jade-50/70 mb-2">
                Rate (NGN per RMB)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  max="1000"
                  step="0.01"
                  required
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  placeholder={activeRate ? `Current: ${activeRate.rateNGNtoRMB}` : 'e.g. 85.50'}
                  className="form-field pr-32 text-lg font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-jade-700/50 text-sm">NGN per RMB</span>
              </div>
              <p className="text-xs text-jade-700/50 mt-1.5">Must be between 0 and 1000</p>
            </div>

            {rateInput && !isNaN(parseFloat(rateInput)) && parseFloat(rateInput) > 0 && (
              <div className="p-3.5 bg-jade-900/60 rounded-xl text-sm border border-jade-700/10">
                <p className="text-jade-warm/60 text-xs font-medium uppercase tracking-wider mb-2">Preview</p>
                <p className="text-jade-50 font-medium">
                  ₦{(parseFloat(rateInput) * 1000).toLocaleString()} = ¥1,000
                </p>
                <p className="text-jade-50/80 mt-0.5">
                  ₦100,000 = ¥{(100000 / parseFloat(rateInput)).toFixed(2)}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={setRateMutation.isPending || !rateInput}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {setRateMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-jade-900/30 border-t-jade-900 rounded-full animate-spin" />
                  Setting rate...
                </>
              ) : (
                'Set New Rate'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Rate History */}
      <div>
        <h2 className="text-lg font-semibold text-jade-50 mb-4">Rate History</h2>
        <div className="table-shell">
          {historyError ? (
            <ErrorState message="Failed to load rate history" />
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rate (NGN per RMB)</th>
                      <th>Set By</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <SkeletonTable rows={5} cols={4} />
                    ) : history.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-jade-700/60">No rate history found</td>
                      </tr>
                    ) : (
                      history.map((r) => (
                        <tr key={r._id}>
                          <td className="px-5 py-3.5">
                            <span className="text-jade-50 font-bold text-lg tracking-tight">{r.rateNGNtoRMB}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="text-sm text-jade-50">{r.setBy?.fullName ?? '—'}</p>
                              <p className="text-xs text-jade-700/60">@{r.setBy?.username}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-jade-warm/60 whitespace-nowrap">
                            {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge status={r.isActive ? 'active' : 'inactive'} label={r.isActive ? 'Active' : 'Inactive'} />
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
                onPage={(p) => setHistoryPage(p)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
