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
    <div className="flex items-center justify-between px-4 py-3 border-t border-jade-700/40">
      <p className="text-sm text-jade-warm">
        Showing <span className="font-medium text-jade-50">{from}–{to}</span> of{' '}
        <span className="font-medium text-jade-50">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-2 py-1.5 text-sm rounded-lg text-jade-warm hover:text-jade-50 hover:bg-jade-700/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ‹ Prev
        </button>
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-jade-700">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                p === page
                  ? 'bg-jade-400 text-jade-900 font-semibold'
                  : 'text-jade-warm hover:text-jade-50 hover:bg-jade-700/20'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="px-2 py-1.5 text-sm rounded-lg text-jade-warm hover:text-jade-50 hover:bg-jade-700/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next ›
        </button>
      </div>
    </div>
  )
}
