"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { ValeWithDetails, ValeWithItems } from "./types"

interface ValesFilters {
  search?: string
  status?: string
}

export function useVales(filters?: ValesFilters) {
  return useQuery({
    queryKey: ["vales", filters],
    queryFn: async (): Promise<ValeWithDetails[]> => {
      const supabase = createClient()

      let query = supabase
        .from("vales")
        .select(
          `*,
          customers:customers!vales_customer_id_fkey(id, name)`
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.search) {
        const q = filters.search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)
        query = query.or(`vale_number.ilike.%${q}%,customers.name.ilike.%${q}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as ValeWithDetails[]
    },
    placeholderData: (prev) => prev,
  })
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
