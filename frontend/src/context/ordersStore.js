import { create } from 'zustand'
import { ordersApi } from '../api'

export const useOrdersStore = create((set) => ({
  orders: [],
  loading: false,

  fetchOrders: async () => {
    try {
      set({ loading: true })
      const { data } = await ordersApi.getAll()
      set({ orders: data })
    } finally {
      set({ loading: false })
    }
  },

  placeOrder: async () => {
    const { data } = await ordersApi.place()
    set((state) => ({ orders: [data, ...state.orders] }))
    return data
  },

  cancelOrder: async (orderId) => {
    const { data } = await ordersApi.cancel(orderId)
    set((state) => ({
      orders: state.orders.map((order) => order.id === orderId ? data : order),
    }))
    return data
  },

  reorderOrder: async (orderId) => {
    return ordersApi.reorder(orderId)
  },

  clearOrders: () => set({ orders: [] }),
}))
