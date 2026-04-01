"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { InventoryVariant, MovementWithDetails } from "./types"

// ── Inventory list ──

interface InventoryFilters {
  search?: string
  categoryId?: string
  lowStockOnly?: boolean
  isActive?: boolean
}

export function useInventory(filters?: InventoryFilters) {
  return useQuery({
    queryKey: ["inventory", filters],
    queryFn: async (): Promise<InventoryVariant[]> => {
      const supabase = createClient()

      let query = supabase
        .from("product_variants")
        .select(
          `id, sku, name, price, stock, stock_min, is_active, product_id,
          products!inner(
            id, name, brand, category_id, has_variants,
            categories(id, name)
          )`
        )
        .is("deleted_at", null)
        .is("products.deleted_at", null)

      if (filters?.search) {
        const q = filters.search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)

        // Find product IDs matching name/brand
        const { data: productMatches } = await supabase
          .from("products")
          .select("id")
          .is("deleted_at", null)
          .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)

        const productIds = (productMatches ?? []).map((m) => m.id)

        // Find variant IDs matching SKU
        const { data: skuMatches } = await supabase
          .from("product_variants")
          .select("id")
          .ilike("sku", `%${q}%`)
          .is("deleted_at", null)

        const skuVariantIds = (skuMatches ?? []).map((m) => m.id)

        // Combine: variants whose product matches OR whose SKU matches
        if (productIds.length > 0 && skuVariantIds.length > 0) {
          query = query.or(
            `product_id.in.(${productIds.join(",")}),id.in.(${skuVariantIds.join(",")})`
          )
        } else if (productIds.length > 0) {
          query = query.in("product_id", productIds)
        } else if (skuVariantIds.length > 0) {
          query = query.in("id", skuVariantIds)
        } else {
          // No matches — return empty
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"])
        }
      }

      if (filters?.categoryId) {
        query = query.eq("products.category_id", filters.categoryId)
      }

      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive)
      }

      const { data, error } = await query.order("stock", { ascending: true })

      if (error) throw error

      let results = (data ?? []) as unknown as InventoryVariant[]

      // Filter low stock client-side (stock <= stock_min) since we can't
      // reference another column in a PostgREST filter
      if (filters?.lowStockOnly) {
        results = results.filter((v) => v.stock <= v.stock_min)
      }

      return results
    },
    placeholderData: (prev) => prev,
  })
}

// ── Movement history for a variant ──

interface MovementFilters {
  dateFrom?: string
  dateTo?: string
  type?: string
}

export function useMovements(
  variantId: string | null,
  filters?: MovementFilters
) {
  return useQuery({
    queryKey: ["movements", variantId, filters],
    queryFn: async (): Promise<MovementWithDetails[]> => {
      const supabase = createClient()

      let query = supabase
        .from("inventory_movements")
        .select(
          `*,
          sales(sale_number),
          returns(return_number)`
        )
        .eq("product_variant_id", variantId!)
        .order("created_at", { ascending: false })

      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo)
      }

      if (filters?.type) {
        query = query.eq("type", filters.type)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as MovementWithDetails[]
    },
    enabled: !!variantId,
  })
}

// ── Low stock alerts (for dashboard) ──

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: async (): Promise<InventoryVariant[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("product_variants")
        .select(
          `id, sku, name, price, stock, stock_min, is_active, product_id,
          products!inner(
            id, name, brand, category_id, has_variants,
            categories(id, name)
          )`
        )
        .is("deleted_at", null)
        .is("products.deleted_at", null)
        .eq("is_active", true)

      if (error) throw error

      // Filter where stock <= stock_min and sort by deficit (most urgent first)
      const lowStock = ((data ?? []) as unknown as InventoryVariant[])
        .filter((v) => v.stock <= v.stock_min)
        .sort((a, b) => (a.stock - a.stock_min) - (b.stock - b.stock_min))

      return lowStock
    },
  })
}
