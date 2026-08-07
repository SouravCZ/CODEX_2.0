import { api, setToken, setUser, clearToken } from './api'

export function storeSession(data) {
  setToken(data.access_token)
  setUser(data.user)
}

export async function register({ username, email, password, full_name }) {
  const data = await api.post('/auth/register', { username, email, password, full_name })
  storeSession(data)
  return data.user
}

export async function login({ username, password }) {
  const data = await api.post('/auth/login', { username, password })
  storeSession(data)
  return data.user
}

export async function getMe() {
  const user = await api.get('/auth/me')
  setUser(user)
  return user
}

export async function guest(fullName) {
  const name = (fullName || '').trim() || 'Guest'
  const slug = (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'guest')
  const nonce = Math.random().toString(36).slice(2, 8)
  const data = await api.post('/auth/register', {
    username: `${slug}-${nonce}`,
    email: `${slug}-${nonce}@drift.local`,
    password: nonce.repeat(2),
    full_name: name,
  })
  storeSession(data)
  return data.user
}

export function logout() {
  clearToken()
}

export default { register, login, getMe, guest, logout }
