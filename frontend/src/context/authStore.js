import { create } from 'zustand'
import { useOrdersStore } from './ordersStore'

const stored = () => {
  try {
    const u = localStorage.getItem('agrimart_user')
    return u ? JSON.parse(u) : null
  } catch { return null }
}

export const useAuthStore = create((set) => ({
  user:  stored(),
  token: localStorage.getItem('agrimart_token') || null,

  setAuth: (token, user) => {
    localStorage.setItem('agrimart_token', token)
    localStorage.setItem('agrimart_user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('agrimart_token')
    localStorage.removeItem('agrimart_user')
    useOrdersStore.getState().clearOrders()
    set({ token: null, user: null })
  },

  setUser: (user) => {
    localStorage.setItem('agrimart_user', JSON.stringify(user))
    set({ user })
  },
}))
