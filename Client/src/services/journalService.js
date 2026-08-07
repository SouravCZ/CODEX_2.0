import { api } from './api'

export async function createEntry(content) {
  return api.post('/journal/', { content })
}

export async function listEntries(limit = 30) {
  return api.get(`/journal/history?limit=${limit}`)
}

export default { createEntry, listEntries }
