export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-jade-700/25 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-jade-700/30 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-jade-800 rounded-xl p-5 border border-jade-700/40 animate-pulse">
      <div className="h-4 bg-jade-700/30 rounded w-2/3 mb-4" />
      <div className="h-8 bg-jade-700/30 rounded w-1/2 mb-2" />
      <div className="h-3 bg-jade-700/30 rounded w-1/3" />
    </div>
  )
}

export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`bg-jade-700/30 rounded animate-pulse ${className}`} />
}
