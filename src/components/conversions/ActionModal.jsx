import { useState } from 'react'
import Modal from '../ui/Modal'

const formatNGN = (kobo) => {
  if (!kobo && kobo !== 0) return '—'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(kobo / 100)
}

export default function ActionModal({ conversion, actionType, onConfirm, onClose, isLoading }) {
  const [adminNote, setAdminNote] = useState('')

  if (!conversion || !actionType) return null

  const isComplete = actionType === 'complete'

  return (
    <Modal
      isOpen={!!conversion && !!actionType}
      onClose={onClose}
      title={isComplete ? 'Mark as Completed' : 'Mark as Failed'}
      size="sm"
    >
      <div className="space-y-4">
        <div className={`p-3.5 rounded-xl ${isComplete ? 'bg-green-400/8 border border-green-400/15' : 'bg-red-400/8 border border-red-400/15'}`}>
          <p className={`text-sm font-medium ${isComplete ? 'text-green-400' : 'text-red-400'}`}>
            {isComplete
              ? 'This will mark the conversion as completed.'
              : 'This will mark the conversion as failed and automatically refund the user\'s wallet.'}
          </p>
        </div>

        <div className="p-3.5 bg-jade-900/60 rounded-xl text-sm space-y-2 border border-jade-700/10">
          <div className="flex justify-between">
            <span className="text-jade-warm/60">User:</span>
            <span className="text-jade-50 font-medium">{conversion.user?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-jade-warm/60">Amount:</span>
            <span className="text-jade-50 font-medium">{formatNGN(conversion.amountNGN)}</span>
          </div>
        </div>

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
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 btn btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(conversion._id, adminNote)}
            disabled={isLoading}
            className={`flex-1 btn disabled:opacity-50 ${
              isComplete
                ? 'bg-green-500 hover:bg-green-400 text-white'
                : 'bg-red-500 hover:bg-red-400 text-white'
            }`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isComplete ? 'Confirm Complete' : 'Confirm Failed'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
