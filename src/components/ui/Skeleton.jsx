export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-jade-700/15">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 skeleton-shimmer rounded-md w-3/4" />
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
    <div className="bg-jade-800 rounded-2xl p-5 border border-jade-700/20">
      <div className="h-4 skeleton-shimmer rounded-md w-2/3 mb-4" />
      <div className="h-8 skeleton-shimmer rounded-md w-1/2 mb-2" />
      <div className="h-3 skeleton-shimmer rounded-md w-1/3" />
    </div>
  )
}

export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />
}
