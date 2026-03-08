import api from './axios'

export const getAuditLogs = (params) =>
  api.get('/api/admin/audit-logs', { params })
