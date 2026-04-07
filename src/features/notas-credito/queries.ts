"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { CreditNoteWithDetails } from "./types"

interface CreditNotesFilters {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export function useCreditNotes(filters?: CreditNotesFilters) {
  const query = useQuery({
    queryKey: ["credit-notes", filters?.status, filters?.dateFrom, filters?.dateTo],
    queryFn: async (): Promise<CreditNoteWithDetails[]> => {
      const supabase = createClient()

      let q = supabase
        .from("credit_notes")
        .select(
          `*,
          customers:customers!credit_notes_customer_id_fkey(id, name),
          returns:returns!credit_notes_return_id_fkey(return_number),
          credit_note_items(*)`
        )
        .is("deleted_at", null)
        .in("credit_type", ["lending", "exchange"])
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
      return (data ?? []) as unknown as CreditNoteWithDetails[]
    },
    placeholderData: (prev) => prev,
  })

  const filtered = useMemo(() => {
    const all = query.data ?? []
    if (!filters?.search?.trim()) return all
    const s = filters.search.trim().toLowerCase()
    return all.filter(
      (n) =>
        n.credit_number.toLowerCase().includes(s) ||
        n.customers?.name?.toLowerCase().includes(s)
    )
  }, [query.data, filters?.search])

  return { ...query, data: filtered }
}

// --- CREDIT NOTE STATS (for KPI widgets) ---

export function useCreditNoteStats() {
  const { data: notes } = useCreditNotes()

  const total = notes?.length ?? 0
  const activeLendings = notes?.filter((n) => n.status === "active" && n.credit_type === "lending").length ?? 0
  const exchanges = notes?.filter((n) => n.credit_type === "exchange").length ?? 0
  const settled = notes?.filter((n) => n.status === "settled").length ?? 0

  return { total, activeLendings, exchanges, settled }
}

export function useCreditNoteDetail(creditNoteId: string | null) {
  return useQuery({
    queryKey: ["credit-note-detail", creditNoteId],
    queryFn: async (): Promise<CreditNoteWithDetails> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("credit_notes")
        .select(
          `*,
          customers:customers!credit_notes_customer_id_fkey(id, name),
          returns:returns!credit_notes_return_id_fkey(return_number),
          credit_note_items(*)`
        )
        .eq("id", creditNoteId!)
        .is("deleted_at", null)
        .single()

      if (error) throw error
      return data as unknown as CreditNoteWithDetails
    },
    enabled: !!creditNoteId,
  })
}
