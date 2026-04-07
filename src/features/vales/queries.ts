"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { ValeWithDetails, ValeWithItems } from "./types"

interface ValesFilters {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export function useVales(filters?: ValesFilters) {
  const query = useQuery({
    queryKey: ["vales", filters?.status, filters?.dateFrom, filters?.dateTo],
    queryFn: async (): Promise<ValeWithDetails[]> => {
      const supabase = createClient()

      let q = supabase
        .from("vales")
        .select(
          `*,
          customers:customers!vales_customer_id_fkey(id, name)`
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (filters?.status) {
        q = q.eq("status", filters.status)
      }
      if (filters?.dateFrom) {
        q = q.gte("created_at", filters.dateFrom)
      }
      if (filters?.dateTo) {
        q = q.lte("created_at", filters.dateTo)
      }

      const { data, error } = await q

      if (error) throw error
      return (data ?? []) as unknown as ValeWithDetails[]
    },
    placeholderData: (prev) => prev,
  })

  // Client-side search (PostgREST can't filter on joined tables in .or())
  const filtered = useMemo(() => {
    const all = query.data ?? []
    if (!filters?.search?.trim()) return all
    const s = filters.search.trim().toLowerCase()
    return all.filter(
      (v) =>
        v.vale_number.toLowerCase().includes(s) ||
        v.customers?.name?.toLowerCase().includes(s)
    )
  }, [query.data, filters?.search])

  return { ...query, data: filtered }
}

export function useValeDetail(valeId: string | null) {
  return useQuery({
    queryKey: ["vale-detail", valeId],
    queryFn: async (): Promise<ValeWithItems> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("vales")
        .select(
          `*,
          customers:customers!vales_customer_id_fkey(id, name),
          vale_items(*)`
        )
        .eq("id", valeId!)
        .is("deleted_at", null)
        .single()

      if (error) throw error
      return data as unknown as ValeWithItems
    },
    enabled: !!valeId,
  })
}

export function useValeStats() {
  const { data: vales } = useVales()

  const total = vales?.length ?? 0
  const pending = vales?.filter((v) => v.status === "pending").length ?? 0
  const ready = vales?.filter((v) => v.status === "ready").length ?? 0
  const completed = vales?.filter((v) => v.status === "completed").length ?? 0

  return { total, pending, ready, completed }
}

export function useReadyVales() {
  return useQuery({
    queryKey: ["vales-ready"],
    queryFn: async (): Promise<ValeWithDetails[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("vales")
        .select(
          `*,
          customers:customers!vales_customer_id_fkey(id, name)`
        )
        .eq("status", "ready")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })

      if (error) throw error
      return (data ?? []) as unknown as ValeWithDetails[]
    },
    refetchInterval: 30_000,
  })
}
