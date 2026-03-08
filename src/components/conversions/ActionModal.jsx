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
        <div className={`p-3 rounded-lg ${isComplete ? 'bg-green-400/10 border border-green-400/20' : 'bg-red-400/10 border border-red-400/20'}`}>
          <p className={`text-sm font-medium ${isComplete ? 'text-green-400' : 'text-red-400'}`}>
            {isComplete
              ? 'This will mark the conversion as completed.'
              : 'This will mark the conversion as failed and automatically refund the user\'s wallet.'}
          </p>
        </div>

        <div className="p-3 bg-jade-900 rounded-lg text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-jade-warm">User:</span>
            <span className="text-jade-50 font-medium">{conversion.user?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-jade-warm">Amount:</span>
            <span className="text-jade-50 font-medium">{formatNGN(conversion.amountNGN)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-jade-50/80 mb-1.5">
            Admin Note <span className="text-jade-700">(optional)</span>
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Add a note for this action..."
            className="w-full bg-jade-900 border border-jade-700/40 text-jade-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jade-400/50 focus:border-jade-400/50 placeholder-jade-700 resize-none"
          />
          <p className="text-xs text-jade-700/60 mt-1 text-right">{adminNote.length}/500</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-jade-700/20 hover:bg-jade-700/30 text-jade-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(conversion._id, adminNote)}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
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
