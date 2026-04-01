import type { Tables } from "@/types/database"

export type InventoryMovement = Tables<"inventory_movements">
export type TransitWeek = Tables<"transit_weeks">
export type TransitWeekItem = Tables<"transit_week_items">

export type InventoryType = "physical" | "initial_load"

/** Variant with product info for the inventory table */
export interface InventoryVariant {
  id: string
  sku: string | null
  name: string | null
  price: number
  stock: number
  initial_stock: number
  stock_min: number
  is_active: boolean
  product_id: string
  products: {
    id: string
    name: string
    brand: string | null
    category_id: string | null
    has_variants: boolean
    categories: { id: string; name: string } | null
  }
  // Initial Load overrides (only present when querying initial_load inventory)
  override_name?: string | null
  override_price?: number | null
}

/** Movement with optional sale/return number for history view */
export interface MovementWithDetails extends InventoryMovement {
  sales: { sale_number: string } | null
  returns: { return_number: string } | null
}

/** Transit week with item details */
export interface TransitWeekItemWithProduct extends TransitWeekItem {
  product_variants: {
    id: string
    sku: string | null
    name: string | null
    price: number
    products: { id: string; name: string; brand: string | null }
  }
}

export interface TransitWeekWithItems extends TransitWeek {
  transit_week_items: TransitWeekItemWithProduct[]
}

/** Summary totals for the hub page */
export interface InventorySummary {
  physical_total: number
  initial_load_total: number
  transit_total: number
  grand_total: number
}
