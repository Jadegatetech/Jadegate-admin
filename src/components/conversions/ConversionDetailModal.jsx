import Modal from '../ui/Modal'
import Badge from '../ui/Badge'

const formatNGN = (kobo) => {
  if (!kobo && kobo !== 0) return '—'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(kobo / 100)
}

const formatRMB = (val) => {
  if (!val && val !== 0) return '—'
  return `¥${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(val)}`
}

const Row = ({ label, value }) => (
  <div className="flex gap-4 py-2.5 border-b border-jade-700/15 last:border-0">
    <dt className="text-sm text-jade-warm/60 w-40 shrink-0">{label}</dt>
    <dd className="text-sm text-jade-50 font-medium break-all">{value ?? '—'}</dd>
  </div>
)

export default function ConversionDetailModal({ conversion, onClose }) {
  if (!conversion) return null

  const c = conversion

  return (
    <Modal isOpen={!!conversion} onClose={onClose} title="Conversion Detail" size="lg">
      <div className="space-y-5">
        {/* Status */}
        <div className="flex items-center gap-3 p-3.5 bg-jade-900/60 rounded-xl border border-jade-700/10">
          <div>
            <p className="text-[11px] text-jade-700/60 uppercase tracking-wider mb-1.5">Status</p>
            <Badge status={c.status} />
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] text-jade-700/60 uppercase tracking-wider mb-1.5">ID</p>
            <p className="text-xs text-jade-warm/50 font-mono">{c._id}</p>
          </div>
        </div>

        {/* User info */}
        <div>
          <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">User</p>
          <dl>
            <Row label="Name" value={c.user?.fullName} />
            <Row label="Email" value={c.user?.email} />
            <Row label="Phone" value={c.user?.phoneNumber} />
          </dl>
        </div>

        {/* Conversion details */}
        <div>
          <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">Conversion</p>
          <dl>
            <Row label="Amount NGN" value={formatNGN(c.amountNGN)} />
            <Row label="Amount RMB" value={formatRMB(c.amountRMB)} />
            <Row label="Rate Used" value={c.rateUsed ? `${c.rateUsed} NGN/RMB` : '—'} />
          </dl>
        </div>

        {/* Receiving method */}
        <div>
          <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">Receiving Method</p>
          <dl>
            <Row label="Method" value={
              <Badge status={c.receivingMethod} label={c.receivingMethod === 'chinese_bank' ? 'Chinese Bank Transfer' : 'Alipay'} />
            } />
            {c.receivingMethod === 'alipay' && (
              <Row label="Alipay Contact" value={c.alipayContact} />
            )}
            {c.receivingMethod === 'chinese_bank' && (
              <>
                <Row label="Recipient Name" value={c.bankRecipientName} />
                <Row label="Bank Name" value={c.bankName} />
                <Row label="Card Number" value={c.bankCardDisplay} />
              </>
            )}
          </dl>
        </div>

        {/* Admin note */}
        {c.adminNote && (
          <div>
            <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">Admin Note</p>
            <p className="text-sm text-jade-50 bg-jade-900/60 rounded-xl p-3.5 border border-jade-700/10">{c.adminNote}</p>
          </div>
        )}

        {/* Date */}
        <Row
          label="Created At"
          value={c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
        />
      </div>
    </Modal>
  )
}
