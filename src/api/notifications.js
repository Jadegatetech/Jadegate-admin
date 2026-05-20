import api from './axios'

export const sendNotification = (payload) =>
  api.post('/api/admin/notifications/send', payload)
