"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { startOfDay, subDays, format } from "date-fns"

import { createClient } from "@/lib/supabase/client"
import { normalizeSearch } from "@/lib/utils"
import type { PendingSaleWithSummary, POSDashboardStats } from "./types"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface POSProductVariant {
  id: string
  sku: string | null
  name: string | null
  price: number
  cost: number
  stock: number
  is_active: boolean
}

export interface POSBundleItem {
  product_variant_id: string
  product_variants: {
    id: string
    stock: number
    reserved_stock: number
    name: string | null
    sku: string | null
    products: { name: string }
  }
}

export interface POSProduct {
  id: string
  name: string
  brand: string | null
  has_variants: boolean
  is_bundle: boolean
  product_variants: POSProductVariant[]
  bundle_items: POSBundleItem[]
}

export interface POSProductWithImage {
  id: string
  name: string
  brand: string | null
  has_variants: boolean
  is_bundle: boolean
  image_url: string | null
  product_variants: {
    id: string
    sku: string | null
    name: string | null
    price: number
    cost: number
    stock: number
    reserved_stock: number
    is_active: boolean
  }[]
  bundle_items: POSBundleItem[]
}

// ---------------------------------------------------------------------------
// 1. usePOSProducts (search bar)
// ---------------------------------------------------------------------------

export function usePOSProducts(search: string) {
  return useQuery({
    queryKey: ["pos-products", search],
    queryFn: async (): Promise<POSProduct[]> => {
      if (!search.trim()) return []

      const supabase = createClient()
      const q = search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)
      const qNorm = normalizeSearch(q)

      const { data: skuMatches } = await supabase
        .from("product_variants")
        .select("product_id")
        .or(`sku.ilike.%${q}%,name_normalized.ilike.%${qNorm}%`)
        .is("deleted_at", null)

      const skuProductIds = [
        ...new Set((skuMatches ?? []).map((m) => m.product_id)),
      ]

      let query = supabase
        .from("products")
        .select(
          `id, name, brand, has_variants, is_bundle,
          product_variants:product_variants!product_variants_product_id_fkey(
            id, sku, name, price, cost, stock, is_active
          ),
          bundle_items(
            product_variant_id,
            product_variants:product_variant_id(
              id, stock, reserved_stock, name, sku,
              products(name)
            )
          )`
        )
        .is("deleted_at", null)
        .eq("is_active", true)
        .is("product_variants.deleted_at", null)
        .order("name")
        .limit(20)

      if (skuProductIds.length > 0) {
        query = query.or(
          `name_normalized.ilike.%${qNorm}%,brand.ilike.%${q}%,id.in.(${skuProductIds.join(",")})`
        )
      } else {
        query = query.or(`name_normalized.ilike.%${qNorm}%,brand.ilike.%${q}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as POSProduct[]
    },
    enabled: search.trim().length > 0,
    placeholderData: (prev) => prev,
  })
}

// ---------------------------------------------------------------------------
// 2. usePOSDashboardStats
// ---------------------------------------------------------------------------

export function usePOSDashboardStats() {
  return useQuery({
    queryKey: ["pos-dashboard-stats"],
    queryFn: async (): Promise<POSDashboardStats> => {
      const supabase = createClient()
      const todayStart = format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss")
      const yesterdayStart = format(
        startOfDay(subDays(new Date(), 1)),
        "yyyy-MM-dd'T'HH:mm:ss"
      )

      const { data: todaySales } = await supabase
        .from("sales")
        .select("id, total")
        .eq("tenant_id", TENANT_ID)
        .eq("status", "completed")
        .is("deleted_at", null)
        .gte("created_at", todayStart)

      const todayList = todaySales ?? []
      const todayRevenue = todayList.reduce((sum, s) => sum + (s.total ?? 0), 0)
      const todayTransactions = todayList.length
      const avgTicket = todayTransactions > 0 ? todayRevenue / todayTransactions : 0

      const { data: yesterdaySales } = await supabase
        .from("sales")
        .select("total")
        .eq("tenant_id", TENANT_ID)
        .eq("status", "completed")
        .is("deleted_at", null)
        .gte("created_at", yesterdayStart)
        .lt("created_at", todayStart)

      const yesterdayRevenue = (yesterdaySales ?? []).reduce(
        (sum, s) => sum + (s.total ?? 0),
        0
      )
      const revenueVsYesterday =
        yesterdayRevenue > 0
          ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
          : todayRevenue > 0
            ? 100
            : 0

      const todayIds = todayList.map((s) => s.id)
      let todayUnitsSold = 0
      if (todayIds.length > 0) {
        const { data: items } = await supabase
          .from("sale_items")
          .select("quantity")
          .in("sale_id", todayIds)

        todayUnitsSold = (items ?? []).reduce(
          (sum, i) => sum + (i.quantity ?? 0),
          0
        )
      }

      return {
        todayRevenue,
        todayTransactions,
        todayUnitsSold,
        avgTicket,
        revenueVsYesterday,
      }
    },
    refetchInterval: 60_000,
  })
}

// ---------------------------------------------------------------------------
// 3. useTopSellingProducts
// ---------------------------------------------------------------------------

export function useTopSellingProducts(limit = 10) {
  return useQuery({
    queryKey: ["pos-top-selling", limit],
    queryFn: async (): Promise<POSProductWithImage[]> => {
      const supabase = createClient()
      const thirtyDaysAgo = format(
        startOfDay(subDays(new Date(), 30)),
        "yyyy-MM-dd'T'HH:mm:ss"
      )

      const { data: recentSales } = await supabase
        .from("sales")
        .select("id")
        .eq("tenant_id", TENANT_ID)
        .eq("status", "completed")
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo)

      const saleIds = (recentSales ?? []).map((s) => s.id)
      if (saleIds.length === 0) return []

      const { data: saleItems } = await supabase
        .from("sale_items")
        .select("product_variant_id, quantity")
        .in("sale_id", saleIds)

      if (!saleItems || saleItems.length === 0) return []

      const variantQty = new Map<string, number>()
      for (const item of saleItems) {
        const vid = item.product_variant_id
        if (vid) {
          variantQty.set(vid, (variantQty.get(vid) ?? 0) + (item.quantity ?? 0))
        }
      }

      const topVariantIds = [...variantQty.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([vid]) => vid)

      if (topVariantIds.length === 0) return []

      const { data: variants } = await supabase
        .from("product_variants")
        .select("product_id")
        .in("id", topVariantIds)
        .is("deleted_at", null)

      const productIds = [...new Set((variants ?? []).map((v) => v.product_id))]
      if (productIds.length === 0) return []

      const { data: products, error } = await supabase
        .from("products")
        .select(
          `id, name, brand, has_variants, is_bundle, image_url,
          product_variants:product_variants!product_variants_product_id_fkey(
            id, sku, name, price, cost, stock, reserved_stock, is_active
          ),
          bundle_items(
            product_variant_id,
            product_variants:product_variant_id(
              id, stock, reserved_stock, name, sku,
              products(name)
            )
          )`
        )
        .in("id", productIds)
        .is("deleted_at", null)
        .eq("is_active", true)
        .is("product_variants.deleted_at", null)
        .eq("product_variants.is_active", true)

      if (error) throw error

      const productQty = new Map<string, number>()
      for (const p of products ?? []) {
        let total = 0
        for (const pv of (p.product_variants as unknown as { id: string }[]) ?? []) {
          total += variantQty.get(pv.id) ?? 0
        }
        productQty.set(p.id, total)
      }

      const sorted = [...(products ?? [])].sort(
        (a, b) => (productQty.get(b.id) ?? 0) - (productQty.get(a.id) ?? 0)
      )

      return sorted as unknown as POSProductWithImage[]
    },
    staleTime: 5 * 60_000,
  })
}

// ---------------------------------------------------------------------------
// 4. useRecentlySoldProducts
// ---------------------------------------------------------------------------

export function useRecentlySoldProducts(limit = 10) {
  return useQuery({
    queryKey: ["pos-recently-sold", limit],
    queryFn: async (): Promise<POSProductWithImage[]> => {
      const supabase = createClient()

      const { data: recentSales } = await supabase
        .from("sales")
        .select("id")
        .eq("tenant_id", TENANT_ID)
        .eq("status", "completed")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50)

      const saleIds = (recentSales ?? []).map((s) => s.id)
      if (saleIds.length === 0) return []

      const { data: saleItems } = await supabase
        .from("sale_items")
        .select("product_variant_id, sale_id")
        .in("sale_id", saleIds)

      if (!saleItems || saleItems.length === 0) return []

      const saleOrder = new Map(saleIds.map((id, idx) => [id, idx]))
      const sortedItems = [...saleItems].sort(
        (a, b) => (saleOrder.get(a.sale_id) ?? 0) - (saleOrder.get(b.sale_id) ?? 0)
      )

      const seen = new Set<string>()
      const uniqueVariantIds: string[] = []
      for (const item of sortedItems) {
        const vid = item.product_variant_id
        if (vid && !seen.has(vid)) {
          seen.add(vid)
          uniqueVariantIds.push(vid)
          if (uniqueVariantIds.length >= limit) break
        }
      }

      if (uniqueVariantIds.length === 0) return []

      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, product_id")
        .in("id", uniqueVariantIds)
        .is("deleted_at", null)

      const variantToProduct = new Map<string, string>()
      for (const v of variants ?? []) {
        variantToProduct.set(v.id, v.product_id)
      }

      const orderedProductIds: string[] = []
      const seenProducts = new Set<string>()
      for (const vid of uniqueVariantIds) {
        const pid = variantToProduct.get(vid)
        if (pid && !seenProducts.has(pid)) {
          seenProducts.add(pid)
          orderedProductIds.push(pid)
        }
      }

      if (orderedProductIds.length === 0) return []

      const { data: products, error } = await supabase
        .from("products")
        .select(
          `id, name, brand, has_variants, is_bundle, image_url,
          product_variants:product_variants!product_variants_product_id_fkey(
            id, sku, name, price, cost, stock, reserved_stock, is_active
          ),
          bundle_items(
            product_variant_id,
            product_variants:product_variant_id(
              id, stock, reserved_stock, name, sku,
              products(name)
            )
          )`
        )
        .in("id", orderedProductIds)
        .is("deleted_at", null)
        .eq("is_active", true)
        .is("product_variants.deleted_at", null)
        .eq("product_variants.is_active", true)

      if (error) throw error

      const productMap = new Map(
        (products ?? []).map((p) => [p.id, p])
      )
      const sorted = orderedProductIds
        .map((pid) => productMap.get(pid))
        .filter(Boolean)

      return sorted as unknown as POSProductWithImage[]
    },
    staleTime: 2 * 60_000,
  })
}

// ---------------------------------------------------------------------------
// 5. usePendingSales
// ---------------------------------------------------------------------------

export function usePendingSales() {
  return useQuery({
    queryKey: ["pos-pending-sales"],
    queryFn: async (): Promise<PendingSaleWithSummary[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("sales")
        .select(
          `id, sale_number, status, subtotal, discount_amount, total, notes, created_at,
          customers:customer_id(id, name),
          sale_items(id, product_name, variant_label, quantity, unit_price, discount, line_total, product_variant_id)`
        )
        .eq("tenant_id", TENANT_ID)
        .eq("status", "pending")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id,
        sale_number: row.sale_number,
        status: row.status,
        subtotal: row.subtotal,
        discount_amount: row.discount_amount,
        total: row.total,
        notes: row.notes,
        created_at: row.created_at,
        customer: row.customers as { id: string; name: string } | null,
        items: (row.sale_items ?? []) as PendingSaleWithSummary["items"],
      }))
    },
    refetchInterval: 30_000,
  })
}

// ---------------------------------------------------------------------------
// 6. useAllPOSProducts (product grid with category filter)
// ---------------------------------------------------------------------------

export function useAllPOSProducts(search: string, categoryIds: string[] | null) {
  return useQuery({
    queryKey: ["pos-all-products", search, categoryIds],
    queryFn: async (): Promise<POSProductWithImage[]> => {
      const supabase = createClient()

      let query = supabase
        .from("products")
        .select(
          `id, name, brand, has_variants, is_bundle, image_url,
          product_variants:product_variants!product_variants_product_id_fkey(
            id, sku, name, price, cost, stock, reserved_stock, is_active
          ),
          bundle_items(
            product_variant_id,
            product_variants:product_variant_id(
              id, stock, reserved_stock, name, sku,
              products(name)
            )
          )`
        )
        .eq("tenant_id", TENANT_ID)
        .is("deleted_at", null)
        .eq("is_active", true)
        .is("product_variants.deleted_at", null)
        .eq("product_variants.is_active", true)
        .order("name")

      // Filter by category (parent + children) via junction table
      if (categoryIds && categoryIds.length > 0) {
        const { data: matchIds } = await supabase
          .from("product_categories")
          .select("product_id")
          .in("category_id", categoryIds)
        const productIds = [...new Set((matchIds ?? []).map((m) => m.product_id))]
        if (productIds.length > 0) {
          query = query.in("id", productIds)
        } else {
          return []
        }
      }

      if (search.trim()) {
        const q = search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)
        const qNorm = normalizeSearch(q)

        const { data: skuMatches } = await supabase
          .from("product_variants")
          .select("product_id")
          .or(`sku.ilike.%${q}%,name_normalized.ilike.%${qNorm}%`)
          .is("deleted_at", null)

        const skuProductIds = [
          ...new Set((skuMatches ?? []).map((m) => m.product_id)),
        ]

        if (skuProductIds.length > 0) {
          query = query.or(
            `name_normalized.ilike.%${qNorm}%,brand.ilike.%${q}%,id.in.(${skuProductIds.join(",")})`
          )
        } else {
          query = query.or(`name_normalized.ilike.%${qNorm}%,brand.ilike.%${q}%`)
        }
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as POSProductWithImage[]
    },
    placeholderData: keepPreviousData,
  })
}

// ---------------------------------------------------------------------------
// 7. useCustomerCreditNotes
// ---------------------------------------------------------------------------

export interface ActiveCreditNote {
  id: string
  credit_number: string
  remaining_amount: number
  expires_at: string | null
  customers: { name: string }
}

export function useCustomerCreditNotes(customerId: string | null) {
  return useQuery({
    queryKey: ["credit-notes", "active", customerId],
    queryFn: async (): Promise<ActiveCreditNote[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("credit_notes")
        .select(
          `id, credit_number, remaining_amount, expires_at,
          customers:customers!credit_notes_customer_id_fkey(name)`
        )
        .eq("customer_id", customerId!)
        .eq("status", "active")
        .gt("remaining_amount", 0)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })

      if (error) throw error

      const now = new Date()
      return ((data ?? []) as unknown as ActiveCreditNote[]).filter(
        (cn) => !cn.expires_at || new Date(cn.expires_at) > now
      )
    },
    enabled: !!customerId,
  })
}
