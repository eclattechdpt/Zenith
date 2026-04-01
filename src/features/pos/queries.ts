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

      // Filter out expired ones client-side
      const now = new Date()
      return ((data ?? []) as unknown as ActiveCreditNote[]).filter(
        (cn) => !cn.expires_at || new Date(cn.expires_at) > now
      )
    },
    enabled: !!customerId,
  })
}
