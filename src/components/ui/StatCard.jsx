export default function StatCard({ title, value, sub, icon: Icon, accent = false, loading = false }) {
  if (loading) {
    return (
      <div className="bg-jade-800 rounded-2xl p-5 border border-jade-700/20">
        <div className="h-4 skeleton-shimmer rounded w-2/3 mb-4" />
        <div className="h-8 skeleton-shimmer rounded w-1/2 mb-2" />
        <div className="h-3 skeleton-shimmer rounded w-1/3" />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 ${accent ? 'bg-jade-400/8 border-jade-400/20' : 'bg-jade-800 border-jade-700/20 hover:border-jade-700/40'}`}>
      <div className="flex items-start justify-between">
        <p className="text-[13px] text-jade-warm/80 font-medium">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-xl ${accent ? 'bg-jade-400/15' : 'bg-jade-700/15'}`}>
            <Icon className={`w-4 h-4 ${accent ? 'text-jade-400' : 'text-jade-warm/70'}`} />
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold mt-3 tracking-tight ${accent ? 'text-jade-400' : 'text-jade-50'}`}>{value}</p>
      {sub && <p className="text-xs text-jade-700/80 mt-1.5">{sub}</p>}
    </div>
  )
}
