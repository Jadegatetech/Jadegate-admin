export default function Pagination({ page, pages, total, limit, onPage }) {
  if (!pages || pages <= 1) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const getPages = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, '...', pages]
    if (page >= pages - 3) return [1, '...', pages - 4, pages - 3, pages - 2, pages - 1, pages]
    return [1, '...', page - 1, page, page + 1, '...', pages]
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-jade-700/25 bg-jade-900/20">
      <p className="text-[13px] text-jade-warm/70">
        Showing <span className="font-medium text-jade-50">{from}–{to}</span> of{' '}
        <span className="font-medium text-jade-50">{total}</span>
      </p>
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="btn btn-sm btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ‹ Prev
        </button>
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-jade-700/50">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-8 h-8 text-[13px] rounded-lg shrink-0 transition-all ${
                p === page
                  ? 'bg-jade-400 text-jade-900 font-semibold shadow-sm shadow-jade-400/20'
                  : 'text-jade-warm/70 hover:text-jade-50 hover:bg-jade-700/15'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="btn btn-sm btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next ›
        </button>
      </div>
    </div>
  )
}
