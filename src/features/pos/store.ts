import { create } from "zustand"

import type { CartItem, CartCustomer, CartDiscount, DiscountSource } from "./types"

export interface DiscountLine {
  // Identifica el tipo de línea: "cart" agrupa items que siguen el carrito;
  // "item" es un override individual.
  kind: "cart" | "item"
  label: string                  // "Desc. cliente" / "Aceite Omega" / ...
  amount: number                 // $ descontado en esta línea
  percent: number | null         // % aplicado, null si custom_amount
  source: DiscountSource
  isGift?: boolean
}

export interface DiscountBreakdown {
  lines: DiscountLine[]
  totalDiscount: number          // suma de todas las líneas (= cart-level distribuido + overrides + custom_amount)
}

const EMPTY_DISCOUNT: CartDiscount = {
  percent: 0,
  source: null,
  listId: null,
  customAmount: 0,
}

// Cargo extra que SUMA al total (ej. servicio a domicilio). label vacío =>
// el recibo usa el texto por defecto "Servicio a domicilio".
export interface CartExtra {
  amount: number
  label: string
}

const EMPTY_EXTRA: CartExtra = { amount: 0, label: "" }

interface POSStore {
  // ── State ──
  items: CartItem[]
  customer: CartCustomer | null
  cartDiscount: CartDiscount
  extra: CartExtra
  notes: string

  // ── Cart items ──
  addItem: (
    item: Omit<
      CartItem,
      | "quantity"
      | "discount"
      | "itemDiscountPercent"
      | "itemDiscountSource"
      | "itemDiscountListId"
    > & { quantity?: number }
  ) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  updateItemDiscount: (variantId: string, discount: number) => void
  updateItemPrice: (variantId: string, unitPrice: number) => void
  // Establece override per-item. Pasa source=null para limpiar el override (vuelve a seguir el cart-level).
  setItemDiscount: (
    variantId: string,
    percent: number,
    source: DiscountSource | null,
    listId?: string | null
  ) => void

  // ── Customer ──
  setCustomer: (customer: CartCustomer | null) => void

  // ── Cart-level discount ──
  setCartDiscount: (discount: Partial<CartDiscount> | null) => void
  // ── Cargo extra (ej. servicio a domicilio) ──
  setExtra: (patch: Partial<CartExtra> | null) => void
  setNotes: (notes: string) => void

  // ── Computed ──
  getSubtotal: () => number             // sum(unitPrice * qty), sin descuentos
  getItemEffectivePercent: (item: CartItem) => number
  getItemDiscountAmount: (item: CartItem) => number  // $ descontado del item
  getItemsDiscount: () => number        // suma de descuentos efectivos por item
  getTotal: () => number
  getItemCount: () => number
  // Convierte un CartItem en payload para sale_items (con discount $ y % calculados)
  buildSaleItemPayload: (item: CartItem) => {
    product_variant_id: string
    product_name: string
    variant_label: string
    quantity: number
    unit_price: number
    unit_cost: number
    discount: number
    discount_percent: number | null
  }
  // Desglose de descuentos para el footer/recibo (solo incluye lo que SÍ aplica)
  getDiscountBreakdown: () => DiscountBreakdown

  // ── Actions ──
  clear: () => void
}

export const usePOSStore = create<POSStore>((set, get) => ({
  // ── Initial state ──
  items: [],
  customer: null,
  cartDiscount: EMPTY_DISCOUNT,
  extra: EMPTY_EXTRA,
  notes: "",

  // ── Cart items ──
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
              : i
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            ...item,
            quantity: item.quantity ?? 1,
            discount: 0,
            itemDiscountPercent: null,
            itemDiscountSource: null,
            itemDiscountListId: null,
          },
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

  setItemDiscount: (variantId, percent, source, listId = null) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.variantId === variantId
          ? source === null
            ? {
                ...i,
                itemDiscountPercent: null,
                itemDiscountSource: null,
                itemDiscountListId: null,
              }
            : {
                ...i,
                itemDiscountPercent: Math.min(100, Math.max(0, percent)),
                itemDiscountSource: source,
                itemDiscountListId: listId,
              }
          : i
      ),
    })),

  // ── Customer ──
  setCustomer: (customer) => set({ customer }),

  // ── Cart-level discount ──
  setCartDiscount: (patch) =>
    set((state) => {
      if (patch === null) {
        return { cartDiscount: EMPTY_DISCOUNT }
      }
      const next: CartDiscount = { ...state.cartDiscount, ...patch }
      // Clamp
      next.percent = Math.min(100, Math.max(0, next.percent))
      next.customAmount = Math.max(0, next.customAmount)
      if (next.source === null) {
        next.percent = 0
        next.customAmount = 0
        next.listId = null
      }
      return { cartDiscount: next }
    }),

  setExtra: (patch) =>
    set((state) => {
      if (patch === null) return { extra: EMPTY_EXTRA }
      const next: CartExtra = { ...state.extra, ...patch }
      next.amount = Math.max(0, next.amount)
      return { extra: next }
    }),

  setNotes: (notes) => set({ notes }),

  // ── Computed ──
  // Subtotal usa unitPrice (respeta precios específicos negociados)
  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

  getItemEffectivePercent: (item) => {
    // Item override gana
    if (item.itemDiscountPercent != null) return item.itemDiscountPercent
    // Fallback al cart-level (solo si es % — el custom_amount aplica al total, no por item)
    const cart = get().cartDiscount
    if (cart.source && cart.source !== "custom_amount") {
      return cart.percent
    }
    return 0
  },

  getItemDiscountAmount: (item) => {
    const pct = get().getItemEffectivePercent(item)
    if (pct <= 0) return 0
    const gross = item.unitPrice * item.quantity
    return Math.round(gross * (pct / 100) * 100) / 100
  },

  getItemsDiscount: () =>
    get().items.reduce((sum, i) => sum + get().getItemDiscountAmount(i), 0),

  getTotal: () => {
    const subtotal = get().getSubtotal()
    const itemsDiscount = get().getItemsDiscount()
    const cart = get().cartDiscount
    // Si cart-level es custom_amount, lo aplicamos al final (sobre el subtotal post items)
    // pero solo si NINGÚN item tiene override (custom_amount no es per-item)
    const customAmount =
      cart.source === "custom_amount" ? cart.customAmount : 0
    // El cargo extra (servicio a domicilio) SUMA al total tras los descuentos.
    return Math.max(0, subtotal - itemsDiscount - customAmount) + get().extra.amount
  },

  getItemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),

  buildSaleItemPayload: (item) => {
    const pct = get().getItemEffectivePercent(item)
    const discountAmount = get().getItemDiscountAmount(item)
    return {
      product_variant_id: item.variantId,
      product_name: item.productName,
      variant_label: item.variantLabel,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unit_cost: item.unitCost,
      discount: discountAmount,
      discount_percent: pct > 0 ? pct : null,
    }
  },

  getDiscountBreakdown: () => {
    const items = get().items
    const cart = get().cartDiscount
    const lines: DiscountLine[] = []
    let cartLevelTotal = 0

    for (const item of items) {
      if (item.itemDiscountPercent != null) {
        // Override per-item — línea individual
        const gross = item.unitPrice * item.quantity
        const amount = Math.round(gross * (item.itemDiscountPercent / 100) * 100) / 100
        if (amount > 0) {
          lines.push({
            kind: "item",
            label: item.productName,
            amount,
            percent: item.itemDiscountPercent,
            source: item.itemDiscountSource ?? "custom_pct",
            isGift: item.itemDiscountSource === "gift",
          })
        }
      } else if (cart.source && cart.source !== "custom_amount") {
        // Sigue al cart-level %
        const gross = item.unitPrice * item.quantity
        cartLevelTotal += Math.round(gross * (cart.percent / 100) * 100) / 100
      }
    }

    // Línea del cart-level solo si AL MENOS un item lo usó
    if (cartLevelTotal > 0 && cart.source && cart.source !== "custom_amount") {
      const label = cart.source === "customer" ? "Desc. cliente" : "Descuento"
      lines.unshift({
        kind: "cart",
        label,
        amount: cartLevelTotal,
        percent: cart.percent,
        source: cart.source,
      })
    }

    // Cart-level custom_amount: línea propia al final
    if (cart.source === "custom_amount" && cart.customAmount > 0) {
      lines.push({
        kind: "cart",
        label: "Descuento adicional",
        amount: cart.customAmount,
        percent: null,
        source: "custom_amount",
      })
    }

    const totalDiscount = lines.reduce((sum, l) => sum + l.amount, 0)
    return { lines, totalDiscount }
  },

  // ── Actions ──
  clear: () =>
    set({
      items: [],
      customer: null,
      cartDiscount: EMPTY_DISCOUNT,
      extra: EMPTY_EXTRA,
      notes: "",
    }),
}))
