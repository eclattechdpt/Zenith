"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

interface POSProductVariant {
  id: string
  sku: string | null
  name: string | null
  price: number
  cost: number
  stock: number
  is_active: boolean
}

export interface POSProduct {
  id: string
  name: string
  brand: string | null
  has_variants: boolean
  product_variants: POSProductVariant[]
}

export function usePOSProducts(search: string) {
  return useQuery({
    queryKey: ["pos-products", search],
    queryFn: async (): Promise<POSProduct[]> => {
      if (!search.trim()) return []

      const supabase = createClient()
      const q = search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)

      // Search by SKU in variants
      const { data: skuMatches } = await supabase
        .from("product_variants")
        .select("product_id")
        .ilike("sku", `%${q}%`)
        .is("deleted_at", null)

      const skuProductIds = [
        ...new Set((skuMatches ?? []).map((m) => m.product_id)),
      ]

      let query = supabase
        .from("products")
        .select(
          `id, name, brand, has_variants,
          product_variants:product_variants!product_variants_product_id_fkey(
            id, sku, name, price, cost, stock, is_active
          )`
        )
        .is("deleted_at", null)
        .eq("is_active", true)
        .is("product_variants.deleted_at", null)
        .order("name")
        .limit(20)

      if (skuProductIds.length > 0) {
        query = query.or(
          `name.ilike.%${q}%,brand.ilike.%${q}%,id.in.(${skuProductIds.join(",")})`
        )
      } else {
        query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as POSProduct[]
    },
    enabled: search.trim().length > 0,
    placeholderData: (prev) => prev,
  })
}
