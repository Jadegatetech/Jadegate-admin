import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getAgents, onboardAgent } from '../api/agents'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { SkeletonTable } from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'

const initialForm = { userId: '', bio: '', location: '', expertise: '' }

export default function Agents() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(initialForm)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['agents', page],
    queryFn: () => getAgents({ page, limit: 20 }),
    select: (res) => res.data,
  })

  const agents = data?.data ?? []
  const pagination = data?.pagination ?? {}

  const onboardMutation = useMutation({
    mutationFn: (body) => onboardAgent(body),
    onSuccess: () => {
      toast.success('Agent onboarded successfully')
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      setModalOpen(false)
      setForm(initialForm)
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to onboard agent'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.userId.trim()) return toast.error('User ID is required')
    onboardMutation.mutate(form)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-jade-50">Agents</h1>
          <p className="text-jade-warm text-sm mt-0.5">Manage Jadegate agents and their profiles</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-jade-400 hover:bg-jade-500 text-jade-900 font-semibold rounded-lg text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Onboard Agent
        </button>
      </div>

      {/* Table */}
      <div className="bg-jade-800 border border-jade-700/40 rounded-xl overflow-hidden">
        {isError ? (
          <ErrorState message="Failed to load agents" onRetry={refetch} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-jade-700/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Expertise</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Bio</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Verified</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-jade-warm uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonTable rows={6} cols={6} />
                  ) : agents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-jade-700">No agents found</td>
                    </tr>
                  ) : (
                    agents.map((a) => (
                      <tr key={a._id} className="border-b border-jade-700/40 hover:bg-jade-700/20 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-jade-50">
                              {a.user?.fullName ?? '—'}
                            </p>
                            <p className="text-xs text-jade-700">{a.user?.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-jade-50/80">{a.location ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-jade-50/80">{a.expertise ?? '—'}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-jade-warm max-w-xs truncate">{a.bio ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            status={a.isVerified ? 'verified' : 'unverified'}
                            label={a.isVerified ? 'Verified' : 'Unverified'}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-jade-warm whitespace-nowrap">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
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

      {/* Onboard Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setForm(initialForm) }} title="Onboard New Agent" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-jade-50/80 mb-1.5">User ID *</label>
            <input
              type="text"
              required
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              placeholder="MongoDB user ObjectId"
              className="w-full bg-jade-900 border border-jade-700/40 text-jade-50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jade-400/50 focus:border-jade-400/50 placeholder-jade-700 font-mono"
            />
            <p className="text-xs text-jade-700 mt-1">The user must already have a registered account</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-jade-50/80 mb-1.5">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Lagos, Nigeria"
              className="w-full bg-jade-900 border border-jade-700/40 text-jade-50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jade-400/50 focus:border-jade-400/50 placeholder-jade-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jade-50/80 mb-1.5">Expertise</label>
            <input
              type="text"
              value={form.expertise}
              onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
              placeholder="e.g. Currency Exchange, SME Imports"
              className="w-full bg-jade-900 border border-jade-700/40 text-jade-50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jade-400/50 focus:border-jade-400/50 placeholder-jade-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jade-50/80 mb-1.5">Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Short bio about this agent..."
              className="w-full bg-jade-900 border border-jade-700/40 text-jade-50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jade-400/50 focus:border-jade-400/50 placeholder-jade-700 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setForm(initialForm) }}
              className="flex-1 px-4 py-2.5 bg-jade-700/20 hover:bg-jade-700/30 text-jade-50 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={onboardMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-jade-400 hover:bg-jade-500 text-jade-900 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {onboardMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-jade-900/30 border-t-jade-900 rounded-full animate-spin" />
              ) : 'Onboard Agent'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
