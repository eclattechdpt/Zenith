"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type {
  InventoryVariant,
  MovementWithDetails,
  InventoryType,
  TransitWeekWithItems,
  TransitMonthSummary,
  InventorySummary,
} from "./types"

// ── Shared variant select ──

const VARIANT_SELECT = `id, sku, name, price, stock, initial_stock, stock_min, is_active, product_id,
  products!inner(
    id, name, brand, has_variants, image_url,
    product_categories(categories(id, name))
  )`

// ── Search helpers ──

async function findMatchingIds(supabase: ReturnType<typeof createClient>, search: string) {
  const q = search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)

  const { data: productMatches } = await supabase
    .from("products")
    .select("id")
    .is("deleted_at", null)
    .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)

  const productIds = (productMatches ?? []).map((m) => m.id)

  const { data: skuMatches } = await supabase
    .from("product_variants")
    .select("id")
    .ilike("sku", `%${q}%`)
    .is("deleted_at", null)

  const skuVariantIds = (skuMatches ?? []).map((m) => m.id)

  return { productIds, skuVariantIds }
}

// ── Physical Inventory ──

interface InventoryFilters {
  search?: string
  categoryIds?: string[]
  lowStockOnly?: boolean
  isActive?: boolean
}

export function useInventory(filters?: InventoryFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["inventory", "physical", filters],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<InventoryVariant[]> => {
      const supabase = createClient()

      let query = supabase
        .from("product_variants")
        .select(VARIANT_SELECT)
        .is("deleted_at", null)
        .is("products.deleted_at", null)

      if (filters?.search) {
        const { productIds, skuVariantIds } = await findMatchingIds(supabase, filters.search)

        if (productIds.length > 0 && skuVariantIds.length > 0) {
          query = query.or(
            `product_id.in.(${productIds.join(",")}),id.in.(${skuVariantIds.join(",")})`
          )
        } else if (productIds.length > 0) {
          query = query.in("product_id", productIds)
        } else if (skuVariantIds.length > 0) {
          query = query.in("id", skuVariantIds)
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"])
        }
      }

      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        const { data: matchIds } = await supabase
          .from("product_categories")
          .select("product_id")
          .in("category_id", filters.categoryIds)
        const productIds = [...new Set((matchIds ?? []).map((m) => m.product_id))]
        if (productIds.length > 0) {
          query = query.in("product_id", productIds)
        } else {
          return []
        }
      }

      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive)
      }

      const { data, error } = await query.order("stock", { ascending: true })

      if (error) throw error

      let results = (data ?? []) as unknown as InventoryVariant[]

      if (filters?.lowStockOnly) {
        results = results.filter((v) => v.stock <= v.stock_min)
      }

      return results
    },
    placeholderData: (prev) => prev,
  })
}

// ── Initial Load Inventory ──

export function useInitialLoadInventory(filters?: InventoryFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["inventory", "initial_load", filters],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<InventoryVariant[]> => {
      const supabase = createClient()

      let query = supabase
        .from("product_variants")
        .select(VARIANT_SELECT)
        .is("deleted_at", null)
        .is("products.deleted_at", null)

      if (filters?.search) {
        const { productIds, skuVariantIds } = await findMatchingIds(supabase, filters.search)

        if (productIds.length > 0 && skuVariantIds.length > 0) {
          query = query.or(
            `product_id.in.(${productIds.join(",")}),id.in.(${skuVariantIds.join(",")})`
          )
        } else if (productIds.length > 0) {
          query = query.in("product_id", productIds)
        } else if (skuVariantIds.length > 0) {
          query = query.in("id", skuVariantIds)
        } else {
          query = query.in("id", ["00000000-0000-0000-0000-000000000000"])
        }
      }

      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        const { data: matchIds } = await supabase
          .from("product_categories")
          .select("product_id")
          .in("category_id", filters.categoryIds)
        const productIds = [...new Set((matchIds ?? []).map((m) => m.product_id))]
        if (productIds.length > 0) {
          query = query.in("product_id", productIds)
        } else {
          return []
        }
      }

      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive)
      }

      const { data, error } = await query.order("initial_stock", { ascending: true })

      if (error) throw error

      const variants = (data ?? []) as unknown as InventoryVariant[]

      // Fetch overrides for all variants
      const variantIds = variants.map((v) => v.id)
      if (variantIds.length > 0) {
        const { data: overrides } = await supabase
          .from("initial_load_overrides")
          .select("product_variant_id, override_name, override_price")
          .in("product_variant_id", variantIds)

        if (overrides && overrides.length > 0) {
          const overrideMap = new Map(
            overrides.map((o) => [o.product_variant_id, o])
          )
          for (const v of variants) {
            const ov = overrideMap.get(v.id)
            if (ov) {
              v.override_name = ov.override_name
              v.override_price = ov.override_price
            }
          }
        }
      }

      return variants
    },
    placeholderData: (prev) => prev,
  })
}

// ── Movement history ──

interface MovementFilters {
  dateFrom?: string
  dateTo?: string
  type?: string
}

export function useMovements(
  variantId: string | null,
  inventorySource: InventoryType = "physical",
  filters?: MovementFilters
) {
  return useQuery({
    queryKey: ["movements", inventorySource, variantId, filters],
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
        .eq("inventory_source", inventorySource)
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

// ── Low stock alerts (for dashboard — Physical only) ──

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: async (): Promise<InventoryVariant[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("product_variants")
        .select(VARIANT_SELECT)
        .is("deleted_at", null)
        .is("products.deleted_at", null)
        .eq("is_active", true)

      if (error) throw error

      const lowStock = ((data ?? []) as unknown as InventoryVariant[])
        .filter((v) => v.stock <= v.stock_min)
        .sort((a, b) => (a.stock - a.stock_min) - (b.stock - b.stock_min))

      return lowStock
    },
  })
}

// ── Transit weeks ──

interface TransitWeekFilters {
  year?: number
  month?: number
}

export function useTransitWeeks(filters?: TransitWeekFilters) {
  return useQuery({
    queryKey: ["transit-weeks", filters],
    enabled: !!filters,
    queryFn: async (): Promise<TransitWeekWithItems[]> => {
      const supabase = createClient()

      let query = supabase
        .from("transit_weeks")
        .select(
          `*,
          transit_week_items(
            *,
            product_variants(
              id, sku, name, price,
              products(id, name, brand, image_url)
            )
          )`
        )
        .is("deleted_at", null)
        .order("month", { ascending: true })
        .order("week_number", { ascending: true })

      if (filters?.year) {
        query = query.eq("year", filters.year)
      }

      if (filters?.month) {
        query = query.eq("month", filters.month)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as TransitWeekWithItems[]
    },
  })
}

export function useTransitMonthSummary(year: number) {
  return useQuery({
    queryKey: ["transit-month-summary", year],
    queryFn: async (): Promise<TransitMonthSummary[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("transit_weeks")
        .select("month, total_value")
        .eq("year", year)
        .is("deleted_at", null)

      if (error) throw error

      // Group by month
      const monthMap = new Map<number, { total: number; count: number }>()
      for (const row of data ?? []) {
        const existing = monthMap.get(row.month) ?? { total: 0, count: 0 }
        existing.total += Number(row.total_value)
        existing.count += 1
        monthMap.set(row.month, existing)
      }

      return Array.from(monthMap.entries())
        .map(([month, { total, count }]) => ({
          month,
          total_value: total,
          week_count: count,
        }))
        .sort((a, b) => a.month - b.month)
    },
  })
}

export function useTransitWeekDetail(weekId: string | null) {
  return useQuery({
    queryKey: ["transit-week", weekId],
    queryFn: async (): Promise<TransitWeekWithItems> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("transit_weeks")
        .select(
          `*,
          transit_week_items(
            *,
            product_variants(
              id, sku, name, price,
              products(id, name, brand, image_url)
            )
          )`
        )
        .eq("id", weekId!)
        .is("deleted_at", null)
        .single()

      if (error) throw error
      return data as unknown as TransitWeekWithItems
    },
    enabled: !!weekId,
  })
}

// ── Inventory summary (for hub page) ──

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

export function useInventorySummary() {
  return useQuery({
    queryKey: ["inventory-summary"],
    queryFn: async (): Promise<InventorySummary> => {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "get_inventory_summary",
        { p_tenant_id: TENANT_ID }
      )

      if (error) throw error

      const result = data as {
        physical_total: number
        initial_load_total: number
        transit_total: number
      }

      return {
        physical_total: Number(result.physical_total),
        initial_load_total: Number(result.initial_load_total),
        transit_total: Number(result.transit_total),
        grand_total:
          Number(result.physical_total) +
          Number(result.initial_load_total) +
          Number(result.transit_total),
      }
    },
  })
}
