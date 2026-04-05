"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { CreditNoteWithDetails } from "./types"

interface CreditNotesFilters {
  search?: string
  status?: string
}

export function useCreditNotes(filters?: CreditNotesFilters) {
  return useQuery({
    queryKey: ["credit-notes", filters],
    queryFn: async (): Promise<CreditNoteWithDetails[]> => {
      const supabase = createClient()

      let query = supabase
        .from("credit_notes")
        .select(
          `*,
          customers:customers!credit_notes_customer_id_fkey(id, name),
          returns:returns!credit_notes_return_id_fkey(return_number)`
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.search) {
        const q = filters.search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)
        query = query.ilike("credit_number", `%${q}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as CreditNoteWithDetails[]
    },
    placeholderData: (prev) => prev,
  })
}

// --- CREDIT NOTE STATS (for KPI widgets) ---

export function useCreditNoteStats() {
  const { data: notes } = useCreditNotes()

  const total = notes?.length ?? 0
  const active = notes?.filter((n) => n.status === "active").length ?? 0
  const activeBalance = notes
    ?.filter((n) => n.status === "active")
    .reduce((sum, n) => sum + Number(n.remaining_amount), 0) ?? 0
  const applied = notes?.filter((n) => n.status === "redeemed").length ?? 0

  return { total, active, activeBalance, applied }
}
