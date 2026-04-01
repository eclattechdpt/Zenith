import { create } from "zustand"

import type { CartItem, CartCustomer } from "./types"

interface POSStore {
  // ── State ──
  items: CartItem[]
  customer: CartCustomer | null
  globalDiscount: number
  notes: string

  // ── Cart items ──
  addItem: (item: Omit<CartItem, "quantity" | "discount"> & { quantity?: number }) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  updateItemDiscount: (variantId: string, discount: number) => void
  updateItemPrice: (variantId: string, unitPrice: number) => void

  // ── Customer ──
  setCustomer: (customer: CartCustomer | null) => void

  // ── Global discount & notes ──
  setGlobalDiscount: (amount: number) => void
  setNotes: (notes: string) => void

  // ── Computed ──
  getSubtotal: () => number
  getItemsDiscount: () => number
  getTotal: () => number
  getItemCount: () => number

  // ── Actions ──
  clear: () => void
}

export const usePOSStore = create<POSStore>((set, get) => ({
  // ── Initial state ──
  items: [],
  customer: null,
  globalDiscount: 0,
  notes: "",

  // ── Cart items ──
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId)
      if (existing) {
        // Increment quantity if already in cart
        return {
          items: state.items.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
              : i
          ),
        }
      }
      // Add new item
      return {
        items: [
          ...state.items,
          { ...item, quantity: item.quantity ?? 1, discount: 0 },
        ],
      }
    }),

  removeItem: (variantId) =>
    set((state) => ({
      items: state.items.filter((i) => i.variantId !== variantId),
    })),

  updateQuantity: (variantId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.variantId !== variantId)
          : state.items.map((i) =>
              i.variantId === variantId ? { ...i, quantity } : i
            ),
    })),

  updateItemDiscount: (variantId, discount) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.variantId === variantId ? { ...i, discount: Math.max(0, discount) } : i
      ),
    })),

  updateItemPrice: (variantId, unitPrice) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.variantId === variantId ? { ...i, unitPrice } : i
      ),
    })),

  // ── Customer ──
  setCustomer: (customer) => set({ customer }),

  // ── Global discount & notes ──
  setGlobalDiscount: (amount) => set({ globalDiscount: Math.max(0, amount) }),
  setNotes: (notes) => set({ notes }),

  // ── Computed ──
  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

  getItemsDiscount: () =>
    get().items.reduce((sum, i) => sum + i.discount, 0),

  getTotal: () => {
    const subtotal = get().getSubtotal()
    const itemsDiscount = get().getItemsDiscount()
    const globalDiscount = get().globalDiscount
    return Math.max(0, subtotal - itemsDiscount - globalDiscount)
  },

  getItemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),

  // ── Actions ──
  clear: () =>
    set({
      items: [],
      customer: null,
      globalDiscount: 0,
      notes: "",
    }),
}))
