import api from './axios'

export const REPORT_REASONS = ['offensive_content', 'harassment', 'spam', 'other']

// UI status filters. `resolved` is a UI alias the backend expands to
// reviewed + actioned.
export const REPORT_STATUS_FILTERS = ['pending', 'resolved', 'dismissed']

export const getReports = (params) =>
  api.get('/api/admin/reports', { params })

export const getReport = (id) =>
  api.get(`/api/admin/reports/${id}`)

export const updateReportStatus = (id, body) =>
  api.patch(`/api/admin/reports/${id}`, body)

// Removal reuses the existing admin-authorized message endpoint.
export const removeReportedMessage = (messageId, reason) =>
  api.delete(`/api/messages/${messageId}`, { data: reason ? { reason } : {} })

export const REASON_LABELS = {
  offensive_content: 'Offensive content',
  harassment: 'Harassment',
  spam: 'Spam',
  other: 'Other',
}

export const STATUS_LABELS = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  dismissed: 'Dismissed',
  actioned: 'Actioned',
}

export const MODERATION_STATUS_LABELS = {
  active: 'Active',
  reported: 'Reported',
  admin_removed: 'Removed (admin)',
  user_deleted: 'Removed (user)',
}
