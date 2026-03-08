import api from './axios'

export const getAgents = (params) =>
  api.get('/api/agents', { params })

export const onboardAgent = (body) =>
  api.post('/api/agents/onboard', body)
