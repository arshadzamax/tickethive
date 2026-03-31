import axios from 'axios'
import { API_BASE_URL } from '../utils/constants.js'

const TOKEN_KEY = 'th_token'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

api.interceptors.request.use(cfg => {
  try {
    cfg.headers = cfg.headers || {}
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      cfg.headers['Authorization'] = `Bearer ${token}`
    }
    // Also send x-client-id for backward compat with WebSocket identity
    const clientId = localStorage.getItem('th_client_id')
    if (clientId) {
      cfg.headers['x-client-id'] = clientId
    }
  } catch { }
  return cfg
})

api.interceptors.response.use(
  r => r,
  e => {
    if (e.response?.status === 401) {
      const hadToken = !!localStorage.getItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_KEY)
      // Only hard-redirect if the user had a token that is now invalid (expired session).
      // Don't redirect anonymous/guest requests on public pages that happen to 401.
      if (hadToken && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(e)
  }
)

export default api
