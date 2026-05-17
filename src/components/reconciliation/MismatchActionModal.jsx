import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import {
  ADJUSTMENT_DIRECTIONS,
  ADJUSTMENT_MISMATCH_TYPES,
  EXCEPTION_CATEGORIES,
  acceptReconciliationException,
  createOpeningBalanceAdjustment,
  noteReconciliationMismatch,
  reviewReconciliationMismatch,
} from '../../api/reconciliation'
import { getApiErrorMessage } from '../../api/errors'

const formatKobo = (kobo) => {
  if (!kobo && kobo !== 0) return '—'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(kobo / 100)
}

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const DetailRow = ({ label, value, mono = false }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-2.5 border-b border-jade-700/15 last:border-0">
    <dt className="text-xs sm:text-sm text-jade-warm/60">{label}</dt>
    <dd className={`text-sm text-jade-50 break-all ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
      {formatValue(value)}
    </dd>
  </div>
)

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={onChange}
    rows={rows}
    maxLength={500}
    placeholder={placeholder}
    className="form-field min-h-24 resize-y"
  />
)

export default function MismatchActionModal({ mismatch, runId, onClose }) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState(mismatch?.adminNote ?? '')
  const [reviewNote, setReviewNote] = useState('')
  const [exceptionCategory, setExceptionCategory] = useState(mismatch?.exceptionCategory ?? '')
  const [exceptionConfidence, setExceptionConfidence] = useState('high')
  const [exceptionNote, setExceptionNote] = useState('')
  const [amountKobo, setAmountKobo] = useState('')
  const [direction, setDirection] = useState('credit_user_wallet')
  const [adjustmentNote, setAdjustmentNote] = useState('')
  const [preview, setPreview] = useState(null)
  const [previewInputs, setPreviewInputs] = useState(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reconciliationMismatches', runId] })
    queryClient.invalidateQueries({ queryKey: ['reconciliationRun', runId] })
    queryClient.invalidateQueries({ queryKey: ['reconciliationRuns'] })
  }

  const noteMutation = useMutation({
    mutationFn: () => noteReconciliationMismatch(mismatch._id, note.trim()),
    onSuccess: () => {
      toast.success('Note saved')
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to save note')),
  })

  const reviewMutation = useMutation({
    mutationFn: (reviewed) =>
      reviewReconciliationMismatch(mismatch._id, {
        reviewed,
        ...(reviewNote.trim() ? { adminNote: reviewNote.trim() } : {}),
      }),
    onSuccess: (_, reviewed) => {
      toast.success(reviewed ? 'Mismatch marked reviewed' : 'Mismatch marked unreviewed')
      invalidate()
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update review state')),
  })

  const previewMutation = useMutation({
    mutationFn: () => {
      const parsedAmount = Number(amountKobo)
      return createOpeningBalanceAdjustment(mismatch._id, {
        dryRun: true,
        amountKobo: parsedAmount,
        direction,
        ...(adjustmentNote.trim() ? { adminNote: adjustmentNote.trim() } : {}),
      })
    },
    onSuccess: (res) => {
      const parsedAmount = Number(amountKobo)
      setPreview(res.data?.data)
      setPreviewInputs({ amountKobo: parsedAmount, direction })
      toast.success('Adjustment preview ready')
    },
    onError: (err) => {
      setPreview(null)
      setPreviewInputs(null)
      toast.error(getApiErrorMessage(err, 'Failed to preview adjustment'))
    },
  })

  const applyMutation = useMutation({
    mutationFn: () =>
      createOpeningBalanceAdjustment(mismatch._id, {
        dryRun: false,
        amountKobo: Number(amountKobo),
        direction,
        adminNote: adjustmentNote.trim(),
      }),
    onSuccess: () => {
      toast.success('Opening-balance adjustment applied')
      invalidate()
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to apply adjustment')),
  })

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptReconciliationException(mismatch._id, {
        category: exceptionCategory,
        confidence: exceptionConfidence,
        adminNote: exceptionNote.trim(),
      }),
    onSuccess: () => {
      toast.success('Historical exception accepted')
      invalidate()
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to accept exception')),
  })

  const canShowAdjustment = useMemo(() => {
    if (!mismatch) return false
    return mismatch.severity === 'critical' && ADJUSTMENT_MISMATCH_TYPES.includes(mismatch.mismatchType)
  }, [mismatch])

  const hasCompleteClassification = Boolean(mismatch?.exceptionCategory && mismatch?.exceptionConfidence)
  const hasHighClassification = Boolean(
    mismatch?.exceptionCategory && mismatch?.exceptionConfidence === 'high',
  )
  const canShowException = Boolean(
    mismatch &&
    mismatch.severity !== 'critical' &&
    !mismatch.acceptedException &&
    (!hasCompleteClassification || hasHighClassification),
  )

  const parsedAmount = Number(amountKobo)
  const previewMatchesInputs =
    previewInputs?.amountKobo === parsedAmount && previewInputs?.direction === direction
  const previewAllowsApply =
    previewMatchesInputs &&
    preview?.wouldResolveBalanceMismatch === true &&
    preview?.projectedDifferenceKobo === 0 &&
    preview?.alreadyAdjusted === false
  const canApplyAdjustment = previewAllowsApply && adjustmentNote.trim().length > 0 && !applyMutation.isPending
  const canPreviewAdjustment =
    Number.isInteger(parsedAmount) &&
    parsedAmount > 0 &&
    ADJUSTMENT_DIRECTIONS.includes(direction) &&
    !previewMutation.isPending
  const canAcceptException =
    Boolean(exceptionCategory) &&
    exceptionConfidence === 'high' &&
    exceptionNote.trim().length > 0 &&
    !acceptMutation.isPending

  if (!mismatch) return null

  return (
    <Modal isOpen={!!mismatch} onClose={onClose} title="Mismatch Detail" size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <div className="space-y-5">
            <div className="surface-card">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge status={mismatch.severity} label={mismatch.severity} />
                <Badge status={mismatch.reviewed ? 'active' : 'pending'} label={mismatch.reviewed ? 'Reviewed' : 'Unreviewed'} />
                {mismatch.acceptedException && (
                  <Badge status="verified" label="Accepted exception" />
                )}
              </div>
              <dl>
                <DetailRow label="Mismatch type" value={mismatch.mismatchType} mono />
                <DetailRow label="Affected collection" value={mismatch.affectedCollection} />
                <DetailRow label="Affected record ID" value={mismatch.affectedRecordId} mono />
                <DetailRow label="Transaction ref" value={mismatch.transactionRef} mono />
                <DetailRow label="User ID" value={mismatch.userId?._id ?? mismatch.userId} mono />
                <DetailRow label="Created" value={mismatch.createdAt ? new Date(mismatch.createdAt).toLocaleString() : '—'} />
                <DetailRow label="Description" value={mismatch.description} />
                <DetailRow label="Admin note" value={mismatch.adminNote} />
                <DetailRow label="Exception category" value={mismatch.exceptionCategory} />
                <DetailRow label="Exception confidence" value={mismatch.exceptionConfidence} />
                <DetailRow label="Inherited exception" value={mismatch.inheritedFromExceptionId} mono />
              </dl>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="surface-card">
                <h3 className="text-sm font-semibold text-jade-50 mb-3">Expected</h3>
                <pre className="text-xs text-jade-warm/75 whitespace-pre-wrap break-words bg-jade-900/60 rounded-lg p-3 border border-jade-700/15">
                  {formatValue(mismatch.expected)}
                </pre>
              </div>
              <div className="surface-card">
                <h3 className="text-sm font-semibold text-jade-50 mb-3">Actual</h3>
                <pre className="text-xs text-jade-warm/75 whitespace-pre-wrap break-words bg-jade-900/60 rounded-lg p-3 border border-jade-700/15">
                  {formatValue(mismatch.actual)}
                </pre>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="surface-card">
              <h3 className="text-sm font-semibold text-jade-50 mb-3">Note</h3>
              <TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add an admin note"
              />
              <button
                onClick={() => noteMutation.mutate()}
                disabled={!note.trim() || noteMutation.isPending}
                className="btn btn-secondary w-full mt-3 disabled:opacity-50"
              >
                Save Note
              </button>
            </div>

            <div className="surface-card">
              <h3 className="text-sm font-semibold text-jade-50 mb-3">Review</h3>
              <TextArea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Optional review note"
              />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => reviewMutation.mutate(true)}
                  disabled={reviewMutation.isPending || mismatch.reviewed}
                  className="btn btn-success disabled:opacity-50"
                >
                  Mark reviewed
                </button>
                <button
                  onClick={() => reviewMutation.mutate(false)}
                  disabled={reviewMutation.isPending || !mismatch.reviewed}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Mark unreviewed
                </button>
              </div>
            </div>

            {canShowException && (
              <div className="surface-card border-jade-400/20">
                <h3 className="text-sm font-semibold text-jade-50 mb-2">Accept Exception</h3>
                <p className="text-xs text-jade-warm/70 mb-3">
                  This does not change financial records. It only marks a historical reconciliation finding as accepted.
                </p>
                {!hasCompleteClassification && (
                  <p className="text-xs text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-lg p-3 mb-3">
                    No category/confidence was provided by the API. Manual entry is allowed, but only high-confidence exceptions can be accepted.
                  </p>
                )}
                <div className="space-y-3">
                  <select
                    value={exceptionCategory}
                    onChange={(e) => setExceptionCategory(e.target.value)}
                    className="form-field"
                  >
                    <option value="">Select category</option>
                    {EXCEPTION_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <select
                    value={exceptionConfidence}
                    onChange={(e) => setExceptionConfidence(e.target.value)}
                    className="form-field"
                  >
                    <option value="high">high</option>
                    <option value="medium">medium</option>
                    <option value="low">low</option>
                  </select>
                  <TextArea
                    value={exceptionNote}
                    onChange={(e) => setExceptionNote(e.target.value)}
                    placeholder="Required admin note"
                  />
                  <button
                    onClick={() => acceptMutation.mutate()}
                    disabled={!canAcceptException}
                    className="btn btn-primary w-full disabled:opacity-50"
                  >
                    Accept Historical Exception
                  </button>
                </div>
              </div>
            )}

            {canShowAdjustment && (
              <div className="surface-card border-red-400/20">
                <h3 className="text-sm font-semibold text-jade-50 mb-2">Opening Balance Adjustment</h3>
                <p className="text-xs text-jade-warm/70 mb-3">
                  Preview is required before live apply. Live apply stays locked unless the preview fully resolves the balance mismatch.
                </p>
                <div className="space-y-3">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amountKobo}
                    onChange={(e) => {
                      setAmountKobo(e.target.value)
                      setPreview(null)
                      setPreviewInputs(null)
                    }}
                    placeholder="amountKobo"
                    className="form-field"
                  />
                  <select
                    value={direction}
                    onChange={(e) => {
                      setDirection(e.target.value)
                      setPreview(null)
                      setPreviewInputs(null)
                    }}
                    className="form-field"
                  >
                    {ADJUSTMENT_DIRECTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <TextArea
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    placeholder="Required admin note for live apply"
                  />
                  <button
                    onClick={() => previewMutation.mutate()}
                    disabled={!canPreviewAdjustment}
                    className="btn btn-secondary w-full disabled:opacity-50"
                  >
                    Preview Adjustment
                  </button>

                  {preview && (
                    <div className="rounded-lg border border-jade-700/20 bg-jade-900/60 p-3 text-xs text-jade-warm/75 space-y-1.5">
                      <p>Current difference: <span className="text-jade-50">{formatKobo(preview.currentDifferenceKobo)}</span></p>
                      <p>Projected difference: <span className="text-jade-50">{formatKobo(preview.projectedDifferenceKobo)}</span></p>
                      <p>Would resolve balance mismatch: <span className="text-jade-50">{preview.wouldResolveBalanceMismatch ? 'Yes' : 'No'}</span></p>
                      <p>Already adjusted: <span className="text-jade-50">{preview.alreadyAdjusted ? 'Yes' : 'No'}</span></p>
                    </div>
                  )}

                  <button
                    onClick={() => applyMutation.mutate()}
                    disabled={!canApplyAdjustment}
                    className="btn btn-danger w-full disabled:opacity-50"
                  >
                    Apply Opening-Balance Adjustment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
