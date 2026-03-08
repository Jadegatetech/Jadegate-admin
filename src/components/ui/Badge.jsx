const variants = {
  pending: 'bg-jade-400/12 text-jade-400 border border-jade-400/20',
  completed: 'bg-green-400/12 text-green-400 border border-green-400/20',
  failed: 'bg-red-400/12 text-red-400 border border-red-400/20',
  cancelled: 'bg-slate-400/12 text-slate-400 border border-slate-400/20',
  active: 'bg-green-400/12 text-green-400 border border-green-400/20',
  inactive: 'bg-slate-400/12 text-slate-400 border border-slate-400/20',
  verified: 'bg-blue-400/12 text-blue-400 border border-blue-400/20',
  unverified: 'bg-slate-400/12 text-slate-400 border border-slate-400/20',
  admin: 'bg-jade-400/12 text-jade-400 border border-jade-400/20',
  alipay: 'bg-blue-400/12 text-blue-400 border border-blue-400/20',
  bank_transfer: 'bg-purple-400/12 text-purple-400 border border-purple-400/20',
}

const dotColors = {
  pending: 'bg-jade-400',
  completed: 'bg-green-400',
  failed: 'bg-red-400',
  cancelled: 'bg-slate-400',
  active: 'bg-green-400',
  inactive: 'bg-slate-400',
  verified: 'bg-blue-400',
  unverified: 'bg-slate-400',
  admin: 'bg-jade-400',
  alipay: 'bg-blue-400',
  bank_transfer: 'bg-purple-400',
}

export default function Badge({ status, label, className = '' }) {
  const style = variants[status] || variants.cancelled
  const dot = dotColors[status] || dotColors.cancelled
  const display = label ?? status
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${style} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {display}
    </span>
  )
}
