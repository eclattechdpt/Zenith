"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { SaleWithSummary, SaleWithItems, SaleDetail } from "./types"

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
          sale_payments(method, amount),
          returns!returns_sale_id_fkey(id, status, deleted_at)`
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (filters?.status) {
        if (filters.status === "returned") {
          query = query.in("status", ["partially_returned", "fully_returned"])
        } else {
          query = query.eq("status", filters.status)
        }
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

// --- SALES STATS (for KPI widgets) ---

export function useSalesStats() {
  const { data: sales } = useSales()

  const completed = (sales ?? []).filter((s) => s.status === "completed" || s.status === "partially_returned" || s.status === "fully_returned")
  const totalSales = completed.length
  const totalRevenue = completed.reduce((sum, s) => sum + Number(s.total), 0)
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0

  return { totalSales, totalRevenue, averageTicket }
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

export function useSaleDetail(saleId: string | null) {
  return useQuery({
    queryKey: ["sales", "detail", saleId],
    queryFn: async (): Promise<SaleDetail> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("sales")
        .select(
          `*,
          customers:customers(id, name),
          sale_items(
            id, product_variant_id, product_name, variant_label,
            quantity, unit_price, unit_cost, discount, line_total
          ),
          sale_payments(id, method, amount, reference),
          returns!returns_sale_id_fkey(
            *,
            return_items(*),
            credit_notes(*)
          )`
        )
        .eq("id", saleId!)
        .single()

      if (error) throw error

      // Filter out cancelled returns
      const sale = data as unknown as SaleDetail
      sale.returns = (sale.returns ?? []).filter(
        (r) => r.status === "completed" && !r.deleted_at
      )

      return sale
    },
    enabled: !!saleId,
  })
}
