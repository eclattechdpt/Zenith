"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { Tables } from "@/types/database"

export type ExportLog = Tables<"export_logs">

interface ExportLogFilters {
  /** ISO date string for start of range */
  from: string
  /** ISO date string for end of range */
  to: string
}

export function useExportLogs(filters: ExportLogFilters) {
  return useQuery({
    queryKey: ["export-logs", filters.from, filters.to],
    queryFn: async (): Promise<ExportLog[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("export_logs")
        .select("*")
        .gte("created_at", filters.from)
        .lte("created_at", filters.to)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}
