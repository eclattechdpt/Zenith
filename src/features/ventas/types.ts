import type { Tables } from "@/types/database"

export type SaleRow = Tables<"sales">

/** Sale with joined customer name and item/payment summaries (for list view) */
export interface SaleWithSummary extends SaleRow {
  customers: { id: string; name: string } | null
  sale_items: { id: string }[]
  sale_payments: { method: string; amount: number }[]
}

/** Full sale detail with items (for convert dialog) */
export interface SaleWithItems extends SaleRow {
  customers: { id: string; name: string } | null
  sale_items: {
    id: string
    product_variant_id: string
    product_name: string
    variant_label: string
    quantity: number
    unit_price: number
    unit_cost: number
    discount: number
    line_total: number
  }[]
}
