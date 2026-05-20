import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { sendNotification } from '../api/notifications'

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_TYPES = {
  marketing: ['holiday_greeting', 'promo', 'rate_announcement', 'general_announcement'],
  system:    ['maintenance_notice', 'app_update', 'service_notice'],
  kyc:       ['kyc_reminder', 'tier_upgrade_reminder'],
  security:  ['security_notice'],
}

const TIER_OPTIONS = [
  { value: '0', label: 'Tier 0' },
  { value: '1', label: 'Tier 1' },
  { value: '2', label: 'Tier 2' },
]

const KYC_OPTIONS = ['unverified', 'verified', 'tier0', 'tier1', 'tier2']

const UNSAFE_CONTENT = /<[a-z][\s\S]*>|javascript:|<script/i

const INITIAL_FORM = {
  title: '',
  body: '',
  category: '',
  type: '',
  push: true,
  inApp: true,
  route: '',
  target: { mode: '', userIds: '', tier: '', inactiveDays: '', kycStatus: '' },
}

const TARGET_MODE_LABELS = {
  all:            'All active users',
  specific_users: 'Specific users',
  tier:           'By tier',
  kyc_status:     'By KYC status',
  inactive_days:  'Inactive users',
}

const CATEGORY_BADGE_COLORS = {
  marketing: 'bg-blue-400/12 text-blue-400 border border-blue-400/20',
  system:    'bg-amber-400/12 text-amber-300 border border-amber-400/20',
  kyc:       'bg-purple-400/12 text-purple-400 border border-purple-400/20',
  security:  'bg-red-400/12 text-red-400 border border-red-400/20',
}

const RESULT_STYLES = {
  completed:      { border: 'border-green-500/30', bg: 'bg-green-400/5', text: 'text-green-400', label: 'Completed' },
  partial_failed: { border: 'border-amber-500/30', bg: 'bg-amber-400/5', text: 'text-amber-300', label: 'Partial failure' },
  failed:         { border: 'border-red-500/30',   bg: 'bg-red-400/5',   text: 'text-red-400',   label: 'Failed' },
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validate(form) {
  const errs = {}

  if (!form.title.trim()) {
    errs.title = 'Title is required'
  } else if (form.title.length > 120) {
    errs.title = 'Title must be 120 characters or fewer'
  } else if (UNSAFE_CONTENT.test(form.title)) {
    errs.title = 'Title must not contain HTML or scripts'
  }

  if (!form.body.trim()) {
    errs.body = 'Message body is required'
  } else if (form.body.length > 500) {
    errs.body = 'Message body must be 500 characters or fewer'
  } else if (UNSAFE_CONTENT.test(form.body)) {
    errs.body = 'Message body must not contain HTML or scripts'
  }

  if (!form.category) {
    errs.category = 'Category is required'
  }

  if (!form.type) {
    errs.type = 'Type is required'
  }

  if (!form.target.mode) {
    errs.mode = 'Target mode is required'
  }

  if (!form.push && !form.inApp) {
    errs.delivery = 'At least one delivery method (Push or In-app) must be enabled'
  }

  if (form.target.mode === 'specific_users') {
    const ids = form.target.userIds.split('\n').map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) errs.userIds = 'Enter at least one user ID'
  }

  if (form.target.mode === 'tier' && !['0', '1', '2'].includes(form.target.tier)) {
    errs.tier = 'Select a tier'
  }

  if (form.target.mode === 'inactive_days') {
    const days = parseInt(form.target.inactiveDays, 10)
    if (!form.target.inactiveDays || isNaN(days) || days < 1) {
      errs.inactiveDays = 'Enter a positive number of days'
    }
  }

  if (form.target.mode === 'kyc_status' && !KYC_OPTIONS.includes(form.target.kycStatus)) {
    errs.kycStatus = 'Select a KYC status'
  }

  return errs
}

// ─── Payload builder ─────────────────────────────────────────────────────────

function buildPayload(form) {
  const { mode, userIds, tier, inactiveDays, kycStatus } = form.target
  const target = { mode }
  if (mode === 'specific_users') target.userIds = userIds.split('\n').map((s) => s.trim()).filter(Boolean)
  if (mode === 'tier')           target.tier = parseInt(tier, 10)
  if (mode === 'inactive_days')  target.inactiveDays = parseInt(inactiveDays, 10)
  if (mode === 'kyc_status')     target.kycStatus = kycStatus

  return {
    title:    form.title.trim(),
    body:     form.body.trim(),
    category: form.category,
    type:     form.type,
    target,
    push:     form.push,
    inApp:    form.inApp,
    ...(form.route.trim() && { data: { route: form.route.trim() } }),
  }
}

// ─── Target summary (human-readable) ─────────────────────────────────────────

function targetSummary(form) {
  const { mode, userIds, tier, inactiveDays, kycStatus } = form.target
  switch (mode) {
    case 'all':            return 'All active users'
    case 'specific_users': {
      const ids = userIds.split('\n').map((s) => s.trim()).filter(Boolean)
      return ids.length ? `${ids.length} specific user${ids.length !== 1 ? 's' : ''}` : 'Specific users (none entered)'
    }
    case 'tier':           return tier !== '' ? `Tier ${tier} users` : 'By tier (not selected)'
    case 'inactive_days':  return inactiveDays ? `Inactive ≥ ${inactiveDays} day${inactiveDays !== '1' ? 's' : ''}` : 'Inactive users (days not set)'
    case 'kyc_status':     return kycStatus ? `KYC status: ${kycStatus}` : 'By KYC status (not selected)'
    default:               return '—'
  }
}

// ─── Preview Card ─────────────────────────────────────────────────────────────

function PreviewCard({ form }) {
  const hasContent = form.title || form.body
  const delivery = form.push && form.inApp ? 'Push + In-app' : form.push ? 'Push only' : form.inApp ? 'In-app only' : 'None'

  return (
    <div className="surface-card sticky top-6">
      <p className="text-[11px] font-semibold text-jade-700/60 uppercase tracking-widest mb-4">Preview</p>
      {!hasContent ? (
        <p className="text-sm text-jade-700/40 text-center py-8">Fill in the form to see a preview</p>
      ) : (
        <div className="space-y-3">
          {/* Notification bubble mockup */}
          <div className="bg-jade-900/60 border border-jade-700/20 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-jade-400/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-jade-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-jade-50 leading-snug truncate">
                  {form.title || <span className="text-jade-700/40 font-normal">Notification title</span>}
                </p>
                <p className="text-xs text-jade-warm/70 mt-1 line-clamp-3 leading-relaxed">
                  {form.body || <span className="text-jade-700/40">Message body will appear here…</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2 pt-1">
            {form.category && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-jade-700/50">Category / Type</span>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${CATEGORY_BADGE_COLORS[form.category] ?? 'bg-slate-400/12 text-slate-400 border border-slate-400/20'}`}>
                    {form.category}
                  </span>
                  {form.type && (
                    <span className="text-jade-warm/50 text-[11px]">{form.type}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-jade-700/50">Delivery</span>
              <span className="text-jade-warm/70 font-medium">{delivery}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-jade-700/50">Target</span>
              <span className="text-jade-warm/70 font-medium text-right max-w-[55%]">
                {form.target.mode ? targetSummary(form) : '—'}
              </span>
            </div>

            {form.route && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-jade-700/50">Deep link</span>
                <span className="text-jade-warm/70 font-mono text-[11px]">{form.route}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ result, onReset }) {
  const style = RESULT_STYLES[result.status] ?? RESULT_STYLES.failed
  const s = result.deliverySummary ?? {}

  const stats = [
    { label: 'Targeted',     value: s.targeted ?? 0 },
    { label: 'Created',      value: s.created ?? 0 },
    { label: 'Push Sent',    value: s.pushSent ?? 0 },
    { label: 'Push Failed',  value: s.pushFailed ?? 0 },
    { label: 'Push Skipped', value: s.pushSkipped ?? 0 },
    { label: 'Skipped',      value: s.skipped ?? 0 },
  ]

  return (
    <div className={`surface-card border ${style.border} ${style.bg}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${style.text}`}>{style.label}</span>
          </div>
          <p className="text-xs text-jade-warm/60 mt-1">
            Broadcast ID: <span className="font-mono text-jade-warm/80">{result.broadcastId}</span>
          </p>
        </div>
        <button
          onClick={onReset}
          className="btn btn-secondary btn-sm shrink-0"
        >
          Send another
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-jade-900/40 rounded-lg px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-jade-50">{value}</p>
            <p className="text-[11px] text-jade-700/60 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Field Error ──────────────────────────────────────────────────────────────

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="text-xs text-red-400 mt-1">{msg}</p>
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-10 h-6 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-jade-400/40 ${
          checked ? 'bg-jade-400' : 'bg-jade-700/40'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-jade-50">{label}</p>
        {description && <p className="text-xs text-jade-warm/50 mt-0.5">{description}</p>}
      </div>
    </label>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Notifications() {
  const [form, setForm]           = useState(INITIAL_FORM)
  const [errors, setErrors]       = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult]       = useState(null)

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const setTarget = (key, value) => setForm((f) => ({ ...f, target: { ...f.target, [key]: value } }))

  const handleCategoryChange = (cat) => {
    setField('category', cat)
    setField('type', '')   // reset type when category changes
    setErrors((e) => ({ ...e, category: undefined, type: undefined }))
  }

  const sendMutation = useMutation({
    mutationFn: sendNotification,
    onSuccess: ({ data }) => {
      setResult(data.data)
      setShowConfirm(false)
      setForm(INITIAL_FORM)
      setErrors({})
    },
    onError: (err) => {
      setShowConfirm(false)
      const status = err.response?.status
      const msg    = err.response?.data?.message ?? err.message ?? 'Unknown error'
      if (status === 503) {
        toast.error('Service temporarily unavailable — please try again later')
      } else if (status === 401 || status === 403) {
        toast.error('Access denied')
      } else {
        toast.error(msg)
      }
    },
  })

  const handleSubmit = () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      // Scroll to first error
      const firstEl = document.querySelector('[data-error="true"]')
      firstEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setShowConfirm(true)
  }

  const handleConfirmSend = () => {
    sendMutation.mutate(buildPayload(form))
  }

  const handleReset = () => {
    setResult(null)
    setForm(INITIAL_FORM)
    setErrors({})
  }

  const types = CATEGORY_TYPES[form.category] ?? []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Send Notification</h1>
          <p className="page-subtitle">Compose and broadcast a manual notification to users</p>
        </div>
      </div>

      {/* Result banner */}
      {result && <ResultCard result={result} onReset={handleReset} />}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Content section */}
          <div className="surface-card space-y-4">
            <p className="text-sm font-semibold text-jade-50">Content</p>

            {/* Title */}
            <div data-error={!!errors.title || undefined}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-jade-50/70">Title</label>
                <span className={`text-[11px] ${form.title.length > 110 ? 'text-amber-400' : 'text-jade-700/40'}`}>
                  {form.title.length}/120
                </span>
              </div>
              <input
                type="text"
                value={form.title}
                maxLength={120}
                onChange={(e) => { setField('title', e.target.value); setErrors((er) => ({ ...er, title: undefined })) }}
                placeholder="e.g. Merry Christmas from Jadegate"
                className={`form-field ${errors.title ? 'border-red-500/50 focus:ring-red-400/30' : ''}`}
              />
              <FieldError msg={errors.title} />
            </div>

            {/* Body */}
            <div data-error={!!errors.body || undefined}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-jade-50/70">Message</label>
                <span className={`text-[11px] ${form.body.length > 460 ? 'text-amber-400' : 'text-jade-700/40'}`}>
                  {form.body.length}/500
                </span>
              </div>
              <textarea
                value={form.body}
                maxLength={500}
                rows={4}
                onChange={(e) => { setField('body', e.target.value); setErrors((er) => ({ ...er, body: undefined })) }}
                placeholder="e.g. Wishing you a joyful holiday season."
                className={`form-field resize-none ${errors.body ? 'border-red-500/50 focus:ring-red-400/30' : ''}`}
              />
              <FieldError msg={errors.body} />
            </div>
          </div>

          {/* Category & Type */}
          <div className="surface-card space-y-4">
            <p className="text-sm font-semibold text-jade-50">Category &amp; Type</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div data-error={!!errors.category || undefined}>
                <label className="block text-[13px] font-medium text-jade-50/70 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`form-field ${errors.category ? 'border-red-500/50' : ''}`}
                >
                  <option value="">Select category</option>
                  {Object.keys(CATEGORY_TYPES).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <FieldError msg={errors.category} />
              </div>

              {/* Type */}
              <div data-error={!!errors.type || undefined}>
                <label className="block text-[13px] font-medium text-jade-50/70 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => { setField('type', e.target.value); setErrors((er) => ({ ...er, type: undefined })) }}
                  disabled={!form.category}
                  className={`form-field disabled:opacity-40 disabled:cursor-not-allowed ${errors.type ? 'border-red-500/50' : ''}`}
                >
                  <option value="">{form.category ? 'Select type' : 'Select category first'}</option>
                  {types.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <FieldError msg={errors.type} />
              </div>
            </div>
          </div>

          {/* Target */}
          <div className="surface-card space-y-4">
            <p className="text-sm font-semibold text-jade-50">Target Audience</p>

            {/* Mode select */}
            <div data-error={!!errors.mode || undefined}>
              <label className="block text-[13px] font-medium text-jade-50/70 mb-1.5">Target mode</label>
              <select
                value={form.target.mode}
                onChange={(e) => { setTarget('mode', e.target.value); setErrors((er) => ({ ...er, mode: undefined })) }}
                className={`form-field ${errors.mode ? 'border-red-500/50' : ''}`}
              >
                <option value="">Select target mode</option>
                {Object.entries(TARGET_MODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <FieldError msg={errors.mode} />
            </div>

            {/* Mode-specific fields */}
            {form.target.mode === 'specific_users' && (
              <div data-error={!!errors.userIds || undefined}>
                <label className="block text-[13px] font-medium text-jade-50/70 mb-1.5">User IDs</label>
                <textarea
                  value={form.target.userIds}
                  rows={4}
                  onChange={(e) => { setTarget('userIds', e.target.value); setErrors((er) => ({ ...er, userIds: undefined })) }}
                  placeholder={'One user ID per line\ne.g.\n64abc123...\n64def456...'}
                  className={`form-field resize-none font-mono text-xs ${errors.userIds ? 'border-red-500/50' : ''}`}
                />
                <p className="text-[11px] text-jade-700/40 mt-1">
                  {form.target.userIds.split('\n').map((s) => s.trim()).filter(Boolean).length} user(s) entered
                </p>
                <FieldError msg={errors.userIds} />
              </div>
            )}

            {form.target.mode === 'tier' && (
              <div data-error={!!errors.tier || undefined}>
                <label className="block text-[13px] font-medium text-jade-50/70 mb-1.5">Tier</label>
                <select
                  value={form.target.tier}
                  onChange={(e) => { setTarget('tier', e.target.value); setErrors((er) => ({ ...er, tier: undefined })) }}
                  className={`form-field ${errors.tier ? 'border-red-500/50' : ''}`}
                >
                  <option value="">Select tier</option>
                  {TIER_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <FieldError msg={errors.tier} />
              </div>
            )}

            {form.target.mode === 'kyc_status' && (
              <div data-error={!!errors.kycStatus || undefined}>
                <label className="block text-[13px] font-medium text-jade-50/70 mb-1.5">KYC Status</label>
                <select
                  value={form.target.kycStatus}
                  onChange={(e) => { setTarget('kycStatus', e.target.value); setErrors((er) => ({ ...er, kycStatus: undefined })) }}
                  className={`form-field ${errors.kycStatus ? 'border-red-500/50' : ''}`}
                >
                  <option value="">Select KYC status</option>
                  {KYC_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <FieldError msg={errors.kycStatus} />
              </div>
            )}

            {form.target.mode === 'inactive_days' && (
              <div data-error={!!errors.inactiveDays || undefined}>
                <label className="block text-[13px] font-medium text-jade-50/70 mb-1.5">Inactive days</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.target.inactiveDays}
                  onChange={(e) => { setTarget('inactiveDays', e.target.value); setErrors((er) => ({ ...er, inactiveDays: undefined })) }}
                  placeholder="e.g. 30"
                  className={`form-field ${errors.inactiveDays ? 'border-red-500/50' : ''}`}
                />
                <p className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Targeting depends on lastActiveAt tracking being up to date
                </p>
                <FieldError msg={errors.inactiveDays} />
              </div>
            )}

            {form.target.mode === 'all' && (
              <div className="bg-jade-900/40 border border-jade-700/20 rounded-lg px-4 py-3">
                <p className="text-xs text-jade-warm/60">
                  This notification will be sent to all active, non-deleted, non-banned users on the platform.
                </p>
              </div>
            )}
          </div>

          {/* Delivery */}
          <div className="surface-card space-y-4">
            <p className="text-sm font-semibold text-jade-50">Delivery</p>

            <div className="space-y-3">
              <Toggle
                checked={form.push}
                onChange={(v) => { setField('push', v); setErrors((er) => ({ ...er, delivery: undefined })) }}
                label="Push notification"
                description="Sends a device push notification to users with the Jadegate app installed"
              />
              <Toggle
                checked={form.inApp}
                onChange={(v) => { setField('inApp', v); setErrors((er) => ({ ...er, delivery: undefined })) }}
                label="In-app notification"
                description="Creates a notification visible in the app's notification centre"
              />
            </div>

            {errors.delivery && (
              <div className="bg-red-400/8 border border-red-500/30 rounded-lg px-3 py-2.5">
                <p className="text-xs text-red-400">{errors.delivery}</p>
              </div>
            )}

            {/* Optional deep link */}
            <div className="pt-1 border-t border-jade-700/20">
              <label className="block text-[13px] font-medium text-jade-50/70 mb-1.5">
                Deep link / route <span className="text-jade-700/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.route}
                onChange={(e) => setField('route', e.target.value)}
                placeholder="e.g. /home or /conversions"
                className="form-field font-mono text-sm"
              />
              <p className="text-[11px] text-jade-700/40 mt-1">
                Tapping the notification navigates to this route in the app
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="btn btn-primary px-6"
            >
              Preview &amp; Send
            </button>
          </div>
        </div>

        {/* ── Preview column ── */}
        <div className="lg:col-span-1">
          <PreviewCard form={form} />
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      <Modal
        isOpen={showConfirm}
        onClose={() => !sendMutation.isPending && setShowConfirm(false)}
        title="Confirm notification send?"
        size="sm"
      >
        <p className="text-sm text-jade-warm/80 leading-relaxed">
          You are about to send this notification to the selected target group. This action cannot be undone.
        </p>

        {/* Compact summary */}
        <div className="mt-4 bg-jade-900/50 border border-jade-700/20 rounded-xl p-4 space-y-2.5 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-jade-700/50 w-16 shrink-0">Title</span>
            <span className="text-jade-50 font-medium leading-snug">{form.title}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-jade-700/50 w-16 shrink-0">Message</span>
            <span className="text-jade-warm/70 leading-snug line-clamp-3">{form.body}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-jade-700/50 w-16 shrink-0">Target</span>
            <span className="text-jade-warm/70">{targetSummary(form)}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-jade-700/50 w-16 shrink-0">Delivery</span>
            <span className="text-jade-warm/70">
              {form.push && form.inApp ? 'Push + In-app' : form.push ? 'Push only' : 'In-app only'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={sendMutation.isPending}
            className="btn btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSend}
            disabled={sendMutation.isPending}
            className="btn btn-primary disabled:opacity-70"
          >
            {sendMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-jade-900/40 border-t-jade-900 rounded-full animate-spin" />
                Sending…
              </span>
            ) : (
              'Send notification'
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}
