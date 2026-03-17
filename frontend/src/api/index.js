import axios from 'axios'
import { Capacitor } from '@capacitor/core'

/**
 * API base URL resolution:
 *
 * 1. In production Android app  → VITE_API_URL env var (your Render deployment URL)
 * 2. On a real device (dev)     → replace with your PC's local network IP
 * 3. In browser dev             → Vite proxy handles /api → localhost:8000
 *
 * Set VITE_API_URL in your .env.production file:
 *   VITE_API_URL=https://agrimart-api.onrender.com
 */
function getBaseURL() {
  // Explicit env var always wins (production build)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Running as native Android app without env var → local network IP
  if (Capacitor.isNativePlatform()) {
    return 'http://10.0.2.2:8000' // Android emulator loopback to host machine
  }
  // Browser dev → use Vite proxy (relative URL)
  return ''
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrimart_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('agrimart_token')
      localStorage.removeItem('agrimart_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (data)          => api.post('/api/auth/register', data),
  login: (mobile, password) => api.post('/api/auth/login', { mobile, password }),
  requestOtp: (mobile)      => api.post('/api/auth/otp/request', { mobile }),
  verifyOtp: (mobile, otp)  => api.post('/api/auth/otp/verify', { mobile, otp }),
}

// ── Market Prices ─────────────────────────────────────
export const marketApi = {
  getPrices: () => api.get('/api/market-prices'),
}

// ── Seeds ─────────────────────────────────────────────
export const seedsApi = {
  getAll: (params) => api.get('/api/seeds', { params }),
  getById: (id)    => api.get(`/api/seeds/${id}`),
}

// ── Fertilizers ───────────────────────────────────────
export const fertilizersApi = {
  getAll: (params) => api.get('/api/fertilizers', { params }),
  getById: (id)    => api.get(`/api/fertilizers/${id}`),
}

// ── Cart ──────────────────────────────────────────────
export const cartApi = {
  get: ()                             => api.get('/api/cart'),
  add: (item_type, item_id, quantity) => api.post('/api/cart', { item_type, item_id, quantity }),
  update: (cart_item_id, quantity)    => api.patch(`/api/cart/${cart_item_id}?quantity=${quantity}`),
  clear: ()                           => api.delete('/api/cart'),
}

export default api
