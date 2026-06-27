import { useState } from 'react'
import Modal from '../ui/Modal'

const COPY = {
  remove: {
    title: 'Remove Message',
    tone: 'danger',
    message:
      'This permanently removes the message and any media for all users. The content will be replaced with "This message was removed." and the report will be marked actioned. This cannot be undone.',
    confirmLabel: 'Confirm Remove',
  },
  dismiss: {
    title: 'Dismiss Report',
    tone: 'neutral',
    message: 'This marks the report as dismissed. The message stays visible to users.',
    confirmLabel: 'Confirm Dismiss',
  },
  resolve: {
    title: 'Mark Report Resolved',
    tone: 'success',
    message: 'This marks the report as reviewed (resolved) without removing the message.',
    confirmLabel: 'Confirm Resolved',
  },
}

const toneStyles = {
  danger: { box: 'bg-red-400/8 border border-red-400/15', text: 'text-red-400', btn: 'bg-red-500 hover:bg-red-400 text-white' },
  neutral: { box: 'bg-jade-700/10 border border-jade-700/20', text: 'text-jade-warm/80', btn: 'btn-secondary' },
  success: { box: 'bg-green-400/8 border border-green-400/15', text: 'text-green-400', btn: 'bg-green-500 hover:bg-green-400 text-white' },
}

export default function ReportActionModal({ report, actionType, onConfirm, onClose, isLoading }) {
  const [adminNote, setAdminNote] = useState('')
  const [applyToAll, setApplyToAll] = useState(false)

  if (!report || !actionType) return null

  const copy = COPY[actionType]
  const tone = toneStyles[copy.tone]

  return (
    <Modal isOpen={!!report && !!actionType} onClose={onClose} title={copy.title} size="sm">
      <div className="space-y-4">
        <div className={`p-3.5 rounded-xl ${tone.box}`}>
          <p className={`text-sm font-medium ${tone.text}`}>{copy.message}</p>
        </div>

        <div className="p-3.5 bg-jade-900/60 rounded-xl text-sm space-y-2 border border-jade-700/10">
          <div className="flex justify-between gap-3">
            <span className="text-jade-warm/60">Reported user:</span>
            <span className="text-jade-50 font-medium text-right">{report.reportedUser?.fullName ?? report.reportedUser?.username ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-jade-warm/60">Reason:</span>
            <span className="text-jade-50 font-medium text-right capitalize">{report.reason?.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {actionType === 'remove' && (
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-jade-400"
            />
            <span className="text-[13px] text-jade-warm/80">
              Also mark <span className="text-jade-50 font-medium">all other reports</span> for this message as actioned
            </span>
          </label>
        )}

        <div>
          <label className="block text-[13px] font-medium text-jade-50/70 mb-2">
            Admin Note <span className="text-jade-700/50">(optional)</span>
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Add a note for this action..."
            className="form-field resize-none"
          />
          <p className="text-[11px] text-jade-700/40 mt-1 text-right">{adminNote.length}/500</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} disabled={isLoading} className="flex-1 btn btn-secondary disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ adminNote: adminNote.trim(), applyToAll })}
            disabled={isLoading}
            className={`flex-1 btn disabled:opacity-50 ${tone.btn}`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              copy.confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
