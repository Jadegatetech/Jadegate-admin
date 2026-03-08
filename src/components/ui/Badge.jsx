const variants = {
  pending: 'bg-jade-400/15 text-jade-400 border border-jade-400/30',
  completed: 'bg-green-400/15 text-green-400 border border-green-400/30',
  failed: 'bg-red-400/15 text-red-400 border border-red-400/30',
  cancelled: 'bg-slate-400/15 text-slate-400 border border-slate-400/30',
  active: 'bg-green-400/15 text-green-400 border border-green-400/30',
  inactive: 'bg-slate-400/15 text-slate-400 border border-slate-400/30',
  verified: 'bg-blue-400/15 text-blue-400 border border-blue-400/30',
  unverified: 'bg-slate-400/15 text-slate-400 border border-slate-400/30',
  admin: 'bg-jade-400/15 text-jade-400 border border-jade-400/30',
  alipay: 'bg-blue-400/15 text-blue-400 border border-blue-400/30',
  bank_transfer: 'bg-purple-400/15 text-purple-400 border border-purple-400/30',
}

export default function Badge({ status, label, className = '' }) {
  const style = variants[status] || variants.cancelled
  const display = label ?? status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style} ${className}`}>
      {display}
    </span>
  )
}
