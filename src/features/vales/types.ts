import type { Tables } from "@/types/database"

export type ValeRow = Tables<"vales">
export type ValeItemRow = Tables<"vale_items">

export interface ValeWithDetails extends ValeRow {
  customers: { id: string; name: string }
}

export interface ValeWithItems extends ValeRow {
  customers: { id: string; name: string }
  vale_items: ValeItemRow[]
}
