import type { Tables } from "@/types/database"

export type SaleRow = Tables<"sales">
export type ReturnRow = Tables<"returns">
export type ReturnItemRow = Tables<"return_items">
export type CreditNoteRow = Tables<"credit_notes">

/** Sale with joined customer name and item/payment summaries (for list view) */
export interface SaleWithSummary extends SaleRow {
  customers: { id: string; name: string } | null
  sale_items: { id: string }[]
  sale_payments: { method: string; amount: number }[]
  returns: { id: string; status: string; deleted_at: string | null }[]
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

/** Sale detail item with computed returnable quantity */
export interface SaleDetailItem {
  id: string
  product_variant_id: string
  product_name: string
  variant_label: string
  quantity: number
  unit_price: number
  unit_cost: number
  discount: number
  line_total: number
}

/** Return with nested items and credit notes */
export interface ReturnWithItems extends ReturnRow {
  return_items: ReturnItemRow[]
  credit_notes: CreditNoteRow[]
}

/** Full sale detail with items, payments, and return history */
export interface SaleDetail extends SaleRow {
  customers: { id: string; name: string } | null
  sale_items: SaleDetailItem[]
  sale_payments: {
    id: string
    method: string
    amount: number
    reference: string | null
  }[]
  returns: ReturnWithItems[]
}
