"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

import { StorageOverview } from "./storage-overview"
import { MediaBrowser } from "./media-browser"
import { useMediaItems, useMediaStats } from "../queries"

export function MediaManager() {
  const { data: items, isLoading } = useMediaItems()
  const stats = useMediaStats(items)
  const queryClient = useQueryClient()

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["media-items"] })
  }, [queryClient])

  return (
    <div className="space-y-6">
      <StorageOverview stats={stats} isLoading={isLoading} />
      <MediaBrowser
        items={items ?? []}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
