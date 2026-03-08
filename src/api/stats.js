import api from './axios'

export const getStats = () =>
  api.get('/api/admin/stats')
