import api from './axios'

export const getConversions = (params) =>
  api.get('/api/admin/conversions', { params })

export const getPendingConversions = (params) =>
  api.get('/api/admin/conversions/pending', { params })

export const markConversionComplete = (id, adminNote) =>
  api.patch(`/api/admin/conversions/${id}/complete`, { adminNote })

export const markConversionFailed = (id, adminNote) =>
  api.patch(`/api/admin/conversions/${id}/fail`, { adminNote })
