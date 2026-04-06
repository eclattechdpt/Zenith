"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

import type { Tables } from "@/types/database"

export type ExportLog = Tables<"export_logs">

export function useExportLogs(limit = 20) {
  return useQuery({
    queryKey: ["export-logs", limit],
    queryFn: async (): Promise<ExportLog[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("export_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data ?? []
    },
  })
}
