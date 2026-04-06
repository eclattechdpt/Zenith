"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { CustomerPriceWithDetails, CustomerWithPriceList, PriceList } from "./types"

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

// --- CUSTOMER SALES HISTORY ---

export interface CustomerSale {
  sale_number: string
  status: string
  total: number
  created_at: string
}

export function useCustomerSales(
  customerId: string | null,
  filters?: { year?: number; month?: number | null }
) {
  const year = filters?.year
  const month = filters?.month
  return useQuery({
    queryKey: ["customer-sales", customerId, year, month],
    queryFn: async (): Promise<CustomerSale[]> => {
      const supabase = createClient()
      let query = supabase
        .from("sales")
        .select("sale_number, status, total, created_at")
        .eq("customer_id", customerId!)
        .in("status", ["completed", "partially_returned", "fully_returned"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (year) {
        const from = month != null
          ? new Date(year, month, 1)
          : new Date(year, 0, 1)
        const to = month != null
          ? new Date(year, month + 1, 0, 23, 59, 59)
          : new Date(year, 11, 31, 23, 59, 59)
        query = query.gte("created_at", from.toISOString()).lte("created_at", to.toISOString())
      }

      const { data, error } = await query.limit(50)

      if (error) return []
      return (data ?? []).map((s) => ({
        ...s,
        total: Number(s.total),
      }))
    },
    enabled: !!customerId,
  })
}

// --- CUSTOMER STATS (for KPI widgets) ---

export function useCustomerStats() {
  const { data: customers } = useCustomers()

  const total = customers?.length ?? 0
  const withDiscount = customers?.filter((c) => c.price_lists !== null).length ?? 0
  const withoutDiscount = total - withDiscount

  return { total, withDiscount, withoutDiscount }
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

// --- CUSTOMER PRICES ---

export function useCustomerPrices(priceListId: string | null) {
  return useQuery({
    queryKey: ["customer-prices", priceListId],
    queryFn: async (): Promise<CustomerPriceWithDetails[]> => {
      if (!priceListId) return []
      const supabase = createClient()

      const { data, error } = await supabase
        .from("customer_prices")
        .select(
          `*,
          product_variants:product_variants(
            id, sku, name, price,
            products:products(name, brand)
          )`
        )
        .eq("price_list_id", priceListId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data ?? []) as unknown as CustomerPriceWithDetails[]
    },
    enabled: !!priceListId,
  })
}
