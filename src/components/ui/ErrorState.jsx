export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-red-400/10 border border-red-400/15 flex items-center justify-center animate-gentle-pulse">
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-jade-50/80 font-medium">{message}</p>
        <p className="text-jade-700/70 text-sm mt-1">Please try again or contact support</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-jade-700/15 hover:bg-jade-700/25 text-jade-50 text-sm rounded-xl transition-all hover:-translate-y-0.5"
        >
          Retry
        </button>
      )}
    </div>
  )
}
