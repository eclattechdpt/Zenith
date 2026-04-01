import type { Tables } from "@/types/database"
import type { PaymentMethod } from "@/lib/constants"

export type Sale = Tables<"sales">
export type SaleItem = Tables<"sale_items">
export type SalePayment = Tables<"sale_payments">

export interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantLabel: string
  sku: string | null
  quantity: number
  basePrice: number
  unitPrice: number
  unitCost: number
  discount: number
  stock: number
}

export interface CartCustomer {
  id: string
  name: string
  priceListId: string | null
  discountPercent: number
}

export interface CartPayment {
  method: PaymentMethod
  amount: number
  reference: string | null
}
