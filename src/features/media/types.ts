export type ImageHostingType = "supabase" | "url" | "data" | "none"

export interface MediaItem {
  productId: string
  productName: string
  brand: string | null
  imageUrl: string | null
  hostingType: ImageHostingType
  categoryName: string | null
  isActive: boolean
}

export interface MediaStats {
  total: number
  withImage: number
  withoutImage: number
  supabase: number
  external: number
  data: number
}
