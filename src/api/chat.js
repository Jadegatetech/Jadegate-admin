import api from './axios'

export const getSessions = (params) =>
  api.get('/api/chat/sessions', { params })

export const getMessages = (sessionId) =>
  api.get(`/api/chat/sessions/${sessionId}/messages`)

export const uploadImage = (file) => {
  const form = new FormData()
  form.append('image', file)
  return api.post('/api/chat/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const assignSession = (sessionId, agentId) =>
  api.patch(`/api/chat/sessions/${sessionId}/assign`, { agentId })

export const closeSession = (sessionId) =>
  api.patch(`/api/chat/sessions/${sessionId}/close`)

export const reopenSession = (sessionId) =>
  api.patch(`/api/chat/sessions/${sessionId}/reopen`)
