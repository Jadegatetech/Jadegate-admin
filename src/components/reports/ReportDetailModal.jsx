import { useQuery } from '@tanstack/react-query'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import { getReport, REASON_LABELS, MODERATION_STATUS_LABELS } from '../../api/reports'
import { isRemovedMessage, REMOVED_MESSAGE_TEXT } from '../../utils/moderation'

const Row = ({ label, value }) => (
  <div className="flex gap-4 py-2.5 border-b border-jade-700/15 last:border-0">
    <dt className="text-sm text-jade-warm/60 w-36 shrink-0">{label}</dt>
    <dd className="text-sm text-jade-50 font-medium break-all">{value ?? '—'}</dd>
  </div>
)

const userLine = (u) => {
  if (!u) return '—'
  const name = u.fullName ?? u.username ?? '—'
  return u.email ? `${name} · ${u.email}` : name
}

// Renders the message preview. Removed messages NEVER show original text/media.
function MessagePreview({ message }) {
  const removed = isRemovedMessage(message)
  if (!message) {
    return <p className="text-sm text-jade-700/50 italic">Message unavailable.</p>
  }
  if (removed) {
    return (
      <p className="text-sm text-jade-700/70 italic">{REMOVED_MESSAGE_TEXT}</p>
    )
  }
  const imgSrc = message.imageUrl ?? message.attachment?.url
  return (
    <div className="space-y-2">
      {imgSrc && (
        <img
          src={imgSrc}
          alt="reported attachment"
          className="rounded-lg max-h-56 object-contain border border-jade-700/20"
        />
      )}
      {message.text ? (
        <p className="text-sm text-jade-50 whitespace-pre-wrap leading-relaxed">{message.text}</p>
      ) : (
        !imgSrc && <p className="text-sm text-jade-700/50 italic">No text content.</p>
      )}
    </div>
  )
}

export default function ReportDetailModal({ reportId, onClose, onAction }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => getReport(reportId),
    enabled: !!reportId,
    select: (res) => res.data?.data,
  })

  const report = data
  const messageRemoved = isRemovedMessage(report?.message)
    || ['admin_removed', 'user_deleted'].includes(report?.messageModerationStatus)

  // Allowed actions mirror the backend transition rules.
  const canRemove = report && !messageRemoved && report.status !== 'actioned'
  const canDismiss = report && ['pending', 'reviewed'].includes(report.status)
  const canResolve = report && report.status === 'pending'

  return (
    <Modal isOpen={!!reportId} onClose={onClose} title="Report Detail" size="lg">
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <span className="w-6 h-6 border-2 border-jade-700/30 border-t-jade-400 rounded-full animate-spin" />
        </div>
      ) : isError || !report ? (
        <p className="py-12 text-center text-red-400 text-sm">Failed to load report.</p>
      ) : (
        <div className="space-y-5">
          {/* Status header */}
          <div className="flex flex-wrap items-center gap-3 p-3.5 bg-jade-900/60 rounded-xl border border-jade-700/10">
            <div>
              <p className="text-[11px] text-jade-700/60 uppercase tracking-wider mb-1.5">Report status</p>
              <Badge status={report.status} />
            </div>
            <div>
              <p className="text-[11px] text-jade-700/60 uppercase tracking-wider mb-1.5">Reason</p>
              <Badge status={report.reason} label={REASON_LABELS[report.reason] ?? report.reason} />
            </div>
            <div className="ml-auto text-right">
              <p className="text-[11px] text-jade-700/60 uppercase tracking-wider mb-1.5">Report ID</p>
              <p className="text-xs text-jade-warm/50 font-mono">{report._id}</p>
            </div>
          </div>

          {/* Safe message preview */}
          <div>
            <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">Reported message</p>
            <div className="p-3.5 bg-jade-900/60 rounded-xl border border-jade-700/10">
              <MessagePreview message={report.message} />
            </div>
            {messageRemoved && (
              <p className="text-[11px] text-jade-700/50 mt-1.5">
                Original content is hidden because the message has been removed.
              </p>
            )}
          </div>

          {/* Parties */}
          <div>
            <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">Parties</p>
            <dl>
              <Row label="Reported user" value={userLine(report.reportedUser)} />
              <Row label="Reporter" value={userLine(report.reporter)} />
            </dl>
          </div>

          {/* Report meta */}
          <div>
            <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">Details</p>
            <dl>
              <Row label="Details" value={report.details} />
              <Row label="Message status" value={
                <Badge
                  status={report.messageModerationStatus ?? 'active'}
                  label={MODERATION_STATUS_LABELS[report.messageModerationStatus] ?? report.messageModerationStatus ?? 'Active'}
                />
              } />
              <Row label="Reports for message" value={report.reportCount ?? '—'} />
              <Row label="Message ID" value={<span className="font-mono text-xs">{String(report.messageId ?? '—')}</span>} />
              <Row label="Session ID" value={<span className="font-mono text-xs">{report.sessionId ? String(report.sessionId) : '—'}</span>} />
              <Row label="Created" value={report.createdAt ? new Date(report.createdAt).toLocaleString() : '—'} />
              {report.adminNote && <Row label="Admin note" value={report.adminNote} />}
            </dl>
          </div>

          {/* Report history */}
          {Array.isArray(report.otherReports) && report.otherReports.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-wider mb-2">
                Other reports for this message ({report.otherReports.length})
              </p>
              <div className="space-y-1.5">
                {report.otherReports.map((o) => (
                  <div key={o._id} className="flex items-center justify-between gap-3 p-2.5 bg-jade-900/40 rounded-lg border border-jade-700/10 text-sm">
                    <span className="text-jade-warm/70 capitalize">{(o.reason ?? '').replace(/_/g, ' ')}</span>
                    <span className="text-jade-warm/50 text-xs">{o.reporter?.username ?? o.reporter?.fullName ?? 'User'}</span>
                    <Badge status={o.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2.5 border-t border-jade-700/15 mt-1 pt-4">
            <button
              onClick={() => onAction('resolve', report)}
              disabled={!canResolve}
              className="btn btn-sm btn-success disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Mark Resolved
            </button>
            <button
              onClick={() => onAction('dismiss', report)}
              disabled={!canDismiss}
              className="btn btn-sm btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Dismiss
            </button>
            <button
              onClick={() => onAction('remove', report)}
              disabled={!canRemove}
              className="btn btn-sm btn-danger ml-auto disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Remove Message
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
