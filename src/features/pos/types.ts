import type { Tables } from "@/types/database"
import type { PaymentMethod } from "@/lib/constants"

export type Sale = Tables<"sales">
export type SaleItem = Tables<"sale_items">
export type SalePayment = Tables<"sale_payments">

export interface BundleComponent {
  variantId: string
  productName: string
  variantLabel: string
  stock: number
}

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
  isBundle?: boolean
  bundleComponents?: BundleComponent[]
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

export interface PendingSaleWithSummary {
  id: string
  sale_number: string
  status: string
  subtotal: number
  discount_amount: number
  total: number
  notes: string | null
  created_at: string
  customer: { id: string; name: string } | null
  items: {
    id: string
    product_name: string
    variant_label: string
    quantity: number
    unit_price: number
    discount: number
    line_total: number
    product_variant_id: string
  }[]
}

export interface POSDashboardStats {
  todayRevenue: number
  todayTransactions: number
  todayUnitsSold: number
  avgTicket: number
  revenueVsYesterday: number
}
