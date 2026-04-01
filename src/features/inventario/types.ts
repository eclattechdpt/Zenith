import type { Tables } from "@/types/database"

export type InventoryMovement = Tables<"inventory_movements">

/** Variant with product info for the inventory table */
export interface InventoryVariant {
  id: string
  sku: string | null
  name: string | null
  price: number
  stock: number
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
}

/** Movement with optional sale/return number for history view */
export interface MovementWithDetails extends InventoryMovement {
  sales: { sale_number: string } | null
  returns: { return_number: string } | null
}
