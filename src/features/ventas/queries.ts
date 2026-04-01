"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { SaleWithSummary, SaleWithItems } from "./types"

interface SalesFilters {
  search?: string
  status?: string
}

export function useSales(filters?: SalesFilters) {
  return useQuery({
    queryKey: ["sales", filters],
    queryFn: async (): Promise<SaleWithSummary[]> => {
      const supabase = createClient()

      let query = supabase
        .from("sales")
        .select(
          `*,
          customers:customers(id, name),
          sale_items(id),
          sale_payments(method, amount)`
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.search) {
        const q = filters.search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)
        query = query.ilike("sale_number", `%${q}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as SaleWithSummary[]
    },
    placeholderData: (prev) => prev,
  })
}

export function useQuoteDetail(quoteId: string | null) {
  return useQuery({
    queryKey: ["sales", quoteId],
    queryFn: async (): Promise<SaleWithItems> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("sales")
        .select(
          `*,
          customers:customers(id, name),
          sale_items(
            id, product_variant_id, product_name, variant_label,
            quantity, unit_price, unit_cost, discount, line_total
          )`
        )
        .eq("id", quoteId!)
        .single()

      if (error) throw error
      return data as unknown as SaleWithItems
    },
    enabled: !!quoteId,
  })
}
