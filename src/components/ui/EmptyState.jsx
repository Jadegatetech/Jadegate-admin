export default function EmptyState({ title = 'Nothing here yet', message, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-jade-700/12 border border-jade-700/20 flex items-center justify-center text-jade-700/70">
        {icon ?? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      <div className="text-center">
        <p className="text-jade-50/80 font-medium">{title}</p>
        {message && <p className="text-jade-700/70 text-sm mt-1">{message}</p>}
      </div>
    </div>
  )
}
