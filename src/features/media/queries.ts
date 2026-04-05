"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import { isStorageUrl, isDataUrl } from "@/lib/supabase/storage"

import type { MediaItem, MediaStats, ImageHostingType } from "./types"

function classifyHosting(url: string | null): ImageHostingType {
  if (!url) return "none"
  if (isStorageUrl(url)) return "supabase"
  if (isDataUrl(url)) return "data"
  return "url"
}

export function useMediaItems() {
  return useQuery({
    queryKey: ["media-items"],
    queryFn: async (): Promise<MediaItem[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("products")
        .select(
          `id, name, brand, image_url, is_active,
          product_categories(categories(name))`
        )
        .is("deleted_at", null)
        .order("name")

      if (error) throw error

      return (data ?? []).map((p) => {
        const cats = (
          p.product_categories as { categories: { name: string } | null }[]
        ) ?? []
        const categoryName = cats[0]?.categories?.name ?? null

        return {
          productId: p.id,
          productName: p.name,
          brand: p.brand,
          imageUrl: p.image_url,
          hostingType: classifyHosting(p.image_url),
          categoryName,
          isActive: p.is_active,
        }
      })
    },
  })
}

export function useMediaStats(items: MediaItem[] | undefined): MediaStats {
  if (!items) {
    return { total: 0, withImage: 0, withoutImage: 0, supabase: 0, external: 0, data: 0 }
  }

  const stats: MediaStats = {
    total: items.length,
    withImage: 0,
    withoutImage: 0,
    supabase: 0,
    external: 0,
    data: 0,
  }

  for (const item of items) {
    if (item.hostingType === "none") {
      stats.withoutImage++
    } else {
      stats.withImage++
      if (item.hostingType === "supabase") stats.supabase++
      else if (item.hostingType === "url") stats.external++
      else if (item.hostingType === "data") stats.data++
    }
  }

  return stats
}
