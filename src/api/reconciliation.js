import api from './axios'

export const RUN_TYPES = ['full', 'wallet', 'deposit', 'conversion', 'bill', 'webhook', 'transaction']
export const RUN_STATUSES = ['running', 'completed', 'failed']
export const SEVERITIES = ['low', 'medium', 'high', 'critical']
export const MISMATCH_TYPES = [
  'wallet.balance_vs_ledger_mismatch',
  'wallet.negative_balance',
  'wallet.non_zero_no_ledger',
  'ledger.orphan_no_wallet',
  'ledger.orphan_no_transaction',
  'ledger.pair_broken',
  'ledger.duplicate_reference',
  'transaction.missing_ledger',
  'transaction.amount_mismatch',
  'transaction.direction_mismatch',
  'transaction.source_mismatch',
  'transaction.status_inconsistent',
  'deposit.webhook_missing',
  'deposit.duplicate_credit',
  'deposit.amount_mismatch',
  'webhook.failed_mutated_balance',
  'webhook.processed_no_transaction',
  'conversion.debit_missing_transaction',
  'conversion.debit_missing_ledger',
  'conversion.rmb_calculation_mismatch',
  'conversion.exchange_rate_missing',
  'conversion.failed_not_refunded',
  'conversion.completed_missing_proof_fields',
  'bill.debit_missing_transaction',
  'bill.debit_missing_ledger',
  'bill.failed_no_refund',
  'bill.duplicate_callback_effect',
  'bill.pending_too_long',
]
export const EXCEPTION_CATEGORIES = [
  'reference_format_drift',
  'missing_historical_ledger',
  'missing_historical_transaction',
  'bill_reference_mismatch',
  'conversion_reference_mismatch',
  'orphan_platform_ledger',
  'stale_pending_bill',
]
export const ADJUSTMENT_MISMATCH_TYPES = [
  'wallet.balance_vs_ledger_mismatch',
  'wallet.non_zero_no_ledger',
]
export const ADJUSTMENT_DIRECTIONS = ['credit_user_wallet', 'debit_user_wallet']

export const getReconciliationRuns = (params) =>
  api.get('/api/admin/reconciliation/runs', { params })

export const startReconciliationRun = ({ runType = 'full', notes = '' } = {}) =>
  api.post('/api/admin/reconciliation/runs', { runType, notes })

export const getReconciliationRun = (id) =>
  api.get(`/api/admin/reconciliation/runs/${id}`)

export const getReconciliationMismatches = (runId, params) =>
  api.get(`/api/admin/reconciliation/runs/${runId}/mismatches`, { params })

export const reviewReconciliationMismatch = (id, payload) =>
  api.patch(`/api/admin/reconciliation/mismatches/${id}/review`, payload)

export const noteReconciliationMismatch = (id, adminNote) =>
  api.patch(`/api/admin/reconciliation/mismatches/${id}/note`, { adminNote })

export const acceptReconciliationException = (id, payload) =>
  api.post(`/api/admin/reconciliation/mismatches/${id}/accept-exception`, payload)

export const createOpeningBalanceAdjustment = (id, payload) =>
  api.post(`/api/admin/reconciliation/mismatches/${id}/opening-balance-adjustment`, payload)
