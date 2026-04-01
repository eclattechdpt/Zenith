"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

/**
 * Subscribes to Supabase Realtime changes on a table.
 * When any row changes, it invalidates the specified query keys
 * so the UI stays in sync across multiple devices.
 */
export function useRealtimeSync(
  table: string,
  queryKeys: string[][]
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          for (const key of queryKeys) {
            queryClient.invalidateQueries({ queryKey: key })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, queryKeys, queryClient])
}
