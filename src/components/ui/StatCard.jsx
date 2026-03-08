export default function StatCard({ title, value, sub, icon: Icon, accent = false, loading = false }) {
  if (loading) {
    return (
      <div className="bg-jade-800 rounded-xl p-5 border border-jade-700/40 animate-pulse">
        <div className="h-4 bg-jade-700/30 rounded w-2/3 mb-4" />
        <div className="h-8 bg-jade-700/30 rounded w-1/2 mb-2" />
        <div className="h-3 bg-jade-700/30 rounded w-1/3" />
      </div>
    )
  }

  return (
    <div className={`rounded-xl p-5 border transition-all ${accent ? 'bg-jade-400/10 border-jade-400/30' : 'bg-jade-800 border-jade-700/40 hover:border-jade-700'}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-jade-warm font-medium">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${accent ? 'bg-jade-400/20' : 'bg-jade-700/20'}`}>
            <Icon className={`w-4 h-4 ${accent ? 'text-jade-400' : 'text-jade-warm'}`} />
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold mt-2 ${accent ? 'text-jade-400' : 'text-jade-50'}`}>{value}</p>
      {sub && <p className="text-xs text-jade-700 mt-1">{sub}</p>}
    </div>
  )
}
