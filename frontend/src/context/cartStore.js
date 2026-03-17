import { create } from 'zustand'
import { cartApi } from '../api'

export const useCartStore = create((set, get) => ({
  cart: { items: [], subtotal: 0, delivery: 50, discount: 0, total: 0 },
  loading: false,

  fetchCart: async () => {
    try {
      set({ loading: true })
      const { data } = await cartApi.get()
      set({ cart: data })
    } catch (e) {
      // not authenticated yet — ignore
    } finally {
      set({ loading: false })
    }
  },

  addItem: async (item_type, item_id, quantity = 1) => {
    const { data } = await cartApi.add(item_type, item_id, quantity)
    set({ cart: data })
    return data
  },

  updateItem: async (cart_item_id, quantity) => {
    const { data } = await cartApi.update(cart_item_id, quantity)
    set({ cart: data })
  },

  clearCart: async () => {
    await cartApi.clear()
    set({ cart: { items: [], subtotal: 0, delivery: 50, discount: 0, total: 0 } })
  },

  itemCount: () => get().cart.items.reduce((a, i) => a + i.quantity, 0),
}))
