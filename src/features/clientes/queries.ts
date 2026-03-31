"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { CustomerWithPriceList, PriceList } from "./types"

// --- CUSTOMERS ---

interface CustomerFilters {
  search?: string
}

export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: async (): Promise<CustomerWithPriceList[]> => {
      const supabase = createClient()

      let query = supabase
        .from("customers")
        .select(
          `*,
          price_lists:price_lists(id, name, discount_percent)`
        )
        .is("deleted_at", null)
        .order("name")

      if (filters?.search) {
        const q = filters.search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)
        query = query.or(
          `name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`
        )
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as CustomerWithPriceList[]
    },
    placeholderData: (prev) => prev,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async (): Promise<CustomerWithPriceList | null> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("customers")
        .select(
          `*,
          price_lists:price_lists(id, name, discount_percent)`
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single()

      if (error) return null
      return data as unknown as CustomerWithPriceList
    },
    enabled: !!id,
  })
}

// --- PRICE LISTS ---

export function usePriceLists() {
  return useQuery({
    queryKey: ["price-lists"],
    queryFn: async (): Promise<PriceList[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("price_lists")
        .select("*")
        .is("deleted_at", null)
        .order("name")

      if (error) throw error
      return (data ?? []) as PriceList[]
    },
  })
}
