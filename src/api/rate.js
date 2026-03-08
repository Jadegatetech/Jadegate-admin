import api from './axios'

export const getActiveRate = () =>
  api.get('/api/admin/rate')

export const setRate = (rateNGNtoRMB) =>
  api.post('/api/admin/rate', { rateNGNtoRMB })

export const getRateHistory = (params) =>
  api.get('/api/admin/rate/history', { params })
