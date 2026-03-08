import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getStats } from '../api/stats'
import { getActiveRate } from '../api/rate'
import StatCard from '../components/ui/StatCard'
import ErrorState from '../components/ui/ErrorState'

const formatNGN = (kobo) => {
  if (!kobo && kobo !== 0) return '—'
  const naira = kobo / 100
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(naira)
}

const formatRMB = (val) => {
  if (!val && val !== 0) return '—'
  return `¥${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(val)}`
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CurrencyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-jade-800 border border-jade-700/30 rounded-xl p-3 shadow-xl shadow-black/20 text-sm">
        <p className="text-jade-warm/70 mb-2 text-xs">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['stats'],
    queryFn: () => getStats(),
    select: (res) => res.data?.data,
  })

  const {
    data: rateData,
    isLoading: rateLoading,
  } = useQuery({
    queryKey: ['activeRate'],
    queryFn: () => getActiveRate(),
    select: (res) => res.data?.data,
  })

  const stats = statsData ?? {}

  const conversionChartData = [
    {
      name: 'Conversions',
      Pending: stats.pendingConversionsCount ?? 0,
      Completed: stats.completedConversionsCount ?? 0,
    },
  ]

  if (statsError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-jade-50 mb-6">Dashboard</h1>
        <ErrorState message="Failed to load dashboard stats" onRetry={refetchStats} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-jade-50 tracking-tight">{getGreeting()} 👋</h1>
          <p className="text-jade-warm/60 text-sm mt-1">Here's what's happening with Jadegate today</p>
        </div>
        <Link
          to="/conversions/pending"
          className="flex items-center gap-2 px-4 py-2.5 bg-jade-400 hover:bg-jade-500 text-jade-900 font-semibold rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-jade-400/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pending Queue
          {stats.pendingConversionsCount > 0 && (
            <span className="bg-jade-900/30 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {stats.pendingConversionsCount}
            </span>
          )}
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: 'Total Users', value: statsLoading ? '—' : (stats.totalUsers ?? 0).toLocaleString(), icon: UsersIcon, delay: '0ms' },
          { title: 'Pending Conversions', value: statsLoading ? '—' : (stats.pendingConversionsCount ?? 0).toLocaleString(), icon: ClockIcon, accent: stats.pendingConversionsCount > 0, delay: '50ms' },
          { title: 'Completed Conversions', value: statsLoading ? '—' : (stats.completedConversionsCount ?? 0).toLocaleString(), icon: CheckIcon, delay: '100ms' },
          { title: 'Total NGN Volume', value: statsLoading ? '—' : formatNGN(stats.totalVolumeNGN), icon: CurrencyIcon, delay: '150ms' },
        ].map((card) => (
          <div key={card.title} className="animate-fade-in-up" style={{ animationDelay: card.delay }}>
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              loading={statsLoading}
              accent={card.accent}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Volume Chart */}
        <div className="xl:col-span-2 bg-jade-800 border border-jade-700/20 rounded-2xl p-6">
          <h2 className="text-[15px] font-semibold text-jade-50 mb-5">Conversion Activity</h2>
          {statsLoading ? (
            <div className="h-64 skeleton-shimmer rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={conversionChartData} barCategoryGap="50%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(67, 136, 142, 0.2)" />
                <XAxis dataKey="name" tick={{ fill: '#EAD5D1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#EAD5D1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Pending" fill="#27EAAF" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Completed" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Active Rate Card */}
          <div className="bg-jade-800 border border-jade-700/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-jade-50">Active Exchange Rate</h2>
              <Link to="/exchange-rate" className="text-xs text-jade-400 hover:text-jade-500 transition-colors font-medium">
                Manage →
              </Link>
            </div>
            {rateLoading ? (
              <div className="space-y-2">
                <div className="h-10 skeleton-shimmer rounded-lg" />
                <div className="h-4 skeleton-shimmer rounded-lg w-2/3" />
              </div>
            ) : rateData ? (
              <>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-3xl font-bold text-jade-400 tracking-tight">
                    {rateData.rateNGNtoRMB}
                  </span>
                  <span className="text-jade-warm/60 text-sm mb-1">NGN / RMB</span>
                </div>
                <p className="text-xs text-jade-700/70 mt-1.5">
                  Set by {rateData.setBy?.fullName ?? rateData.setBy?.username ?? 'admin'}
                </p>
              </>
            ) : (
              <p className="text-jade-warm/60 text-sm">No active rate set</p>
            )}
          </div>

          {/* RMB Volume */}
          <div className="bg-jade-800 border border-jade-700/20 rounded-2xl p-5">
            <p className="text-[13px] text-jade-warm/80 font-medium">Total RMB Volume</p>
            <p className="text-2xl font-bold text-jade-50 mt-3 tracking-tight">
              {statsLoading ? '—' : formatRMB(stats.totalVolumeRMB)}
            </p>
            <p className="text-xs text-jade-700/70 mt-1.5">Total converted to RMB</p>
          </div>

          {/* Quick actions */}
          <div className="bg-jade-800 border border-jade-700/20 rounded-2xl p-5">
            <p className="text-[13px] font-semibold text-jade-50 mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Link
                to="/conversions/pending"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-jade-400/8 hover:bg-jade-400/15 text-jade-400 text-sm transition-all group"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Review Pending Conversions
              </Link>
              <Link
                to="/exchange-rate"
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-jade-700/12 hover:bg-jade-700/20 text-jade-warm/80 hover:text-jade-50 text-sm transition-all group"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Update Exchange Rate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
