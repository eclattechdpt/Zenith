"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import { normalizeSearch } from "@/lib/utils"

import type {
  ProductWithDetails,
  CategoryWithCount,
  VariantTypeWithOptions,
} from "./types"

// --- PRODUCTS ---

interface ProductFilters {
  search?: string
  categoryIds?: string[]
  brand?: string
  isActive?: boolean
}

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async (): Promise<ProductWithDetails[]> => {
      const supabase = createClient()

      let query = supabase
        .from("products")
        .select(
          `*,
          product_categories(categories(id, name)),
          product_variants:product_variants!product_variants_product_id_fkey(
            *,
            variant_option_assignments:variant_option_assignments(
              variant_options:variant_options(
                *,
                variant_types:variant_types(id, name)
              )
            )
          ),
          product_images:product_images(id, storage_path, sort_order),
          bundle_items(product_variant_id, product_variants:product_variant_id(id, stock, name, sku, products(name)))`
        )
        .is("deleted_at", null)
        .is("product_variants.deleted_at", null)
        .order("name")

      if (filters?.search) {
        // Escape SQL/PostgREST wildcards so %, _, and * are treated as literal characters
        const q = filters.search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)
        const qNorm = normalizeSearch(q)

        // Find product IDs that have a variant matching the code or variant label
        const { data: skuMatches } = await supabase
          .from("product_variants")
          .select("product_id")
          .or(`sku.ilike.%${q}%,name_normalized.ilike.%${qNorm}%`)
          .is("deleted_at", null)

        const skuProductIds = [...new Set((skuMatches ?? []).map((m) => m.product_id))]

        if (skuProductIds.length > 0) {
          query = query.or(
            `name_normalized.ilike.%${qNorm}%,brand.ilike.%${q}%,id.in.(${skuProductIds.join(",")})`
          )
        } else {
          query = query.or(
            `name_normalized.ilike.%${qNorm}%,brand.ilike.%${q}%`
          )
        }
      }

      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        const { data: matchIds } = await supabase
          .from("product_categories")
          .select("product_id")
          .in("category_id", filters.categoryIds)
        const productIds = [...new Set((matchIds ?? []).map((m) => m.product_id))]
        if (productIds.length > 0) {
          query = query.in("id", productIds)
        } else {
          return []
        }
      }

      if (filters?.brand) {
        query = query.eq("brand", filters.brand)
      }

      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as unknown as ProductWithDetails[]
    },
    placeholderData: (prev) => prev,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async (): Promise<ProductWithDetails | null> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("products")
        .select(
          `*,
          product_categories(categories(id, name)),
          product_variants:product_variants!product_variants_product_id_fkey(
            *,
            variant_option_assignments:variant_option_assignments(
              variant_options:variant_options(
                *,
                variant_types:variant_types(id, name)
              )
            )
          ),
          product_images:product_images(id, storage_path, sort_order),
          bundle_items(product_variant_id, product_variants:product_variant_id(id, stock, name, sku, products(name)))`
        )
        .eq("id", id)
        .is("deleted_at", null)
        .is("product_variants.deleted_at", null)
        .single()

      if (error) return null
      return data as unknown as ProductWithDetails
    },
    enabled: !!id,
  })
}

// --- PRODUCT STATS (for KPI widgets) ---

interface ProductStats {
  totalProducts: number
  inventoryValue: number
  lowStockCount: number
}

export function useProductStats() {
  return useQuery({
    queryKey: ["product-stats"],
    queryFn: async (): Promise<ProductStats> => {
      const supabase = createClient()

      // Fetch all active products with their active variants in one query
      const { data, error } = await supabase
        .from("products")
        .select(
          `id,
          product_variants!product_variants_product_id_fkey(
            price, stock, stock_min, is_active, deleted_at
          )`
        )
        .eq("is_active", true)
        .is("deleted_at", null)

      if (error) throw error

      let totalProducts = 0
      let inventoryValue = 0
      let lowStockCount = 0

      for (const product of data ?? []) {
        totalProducts++
        const variants = (product.product_variants ?? []).filter(
          (v: { is_active: boolean; deleted_at: string | null }) =>
            v.is_active && !v.deleted_at
        )
        for (const v of variants) {
          const vTyped = v as { price: number; stock: number; stock_min: number }
          inventoryValue += vTyped.price * vTyped.stock
          if (vTyped.stock > 0 && vTyped.stock <= 5) lowStockCount++
        }
      }

      return { totalProducts, inventoryValue, lowStockCount }
    },
  })
}

// --- CATEGORIES ---

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("categories")
        .select("*, product_categories(count)")
        .is("deleted_at", null)
        .order("sort_order")
        .order("name")

      if (error) throw error
      return (data ?? []) as unknown as CategoryWithCount[]
    },
  })
}

// --- PRODUCTS BY CATEGORY ---

export interface CategoryProduct {
  id: string
  name: string
  brand: string | null
  image_url: string | null
  is_active: boolean
}

export function useProductsByCategory(categoryId: string | null) {
  return useQuery({
    queryKey: ["category-products", categoryId],
    queryFn: async (): Promise<CategoryProduct[]> => {
      if (!categoryId) return []
      const supabase = createClient()

      const { data, error } = await supabase
        .from("product_categories")
        .select("product_id, products!inner(id, name, brand, image_url, is_active)")
        .eq("category_id", categoryId)
        .is("products.deleted_at", null)

      if (error) throw error

      return (data ?? []).map((row) => {
        const p = row.products as unknown as CategoryProduct
        return p
      })
    },
    enabled: !!categoryId,
  })
}

// --- PRODUCT SEARCH (for assignment) ---

export function useProductSearch(search: string) {
  return useQuery({
    queryKey: ["product-search-assign", search],
    queryFn: async (): Promise<CategoryProduct[]> => {
      if (!search || search.length < 2) return []
      const supabase = createClient()

      const q = search.trim().replace(/[%_*]/g, (ch) => `\\${ch}`)
      const qNorm = normalizeSearch(q)

      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, image_url, is_active")
        .is("deleted_at", null)
        .ilike("name_normalized", `%${qNorm}%`)
        .order("name")
        .limit(10)

      if (error) throw error
      return (data ?? []) as CategoryProduct[]
    },
    enabled: search.length >= 2,
    placeholderData: (prev) => prev,
  })
}

// --- VARIANT TYPES ---

export function useVariantTypes() {
  return useQuery({
    queryKey: ["variant-types"],
    queryFn: async (): Promise<VariantTypeWithOptions[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("variant_types")
        .select(
          `*,
          variant_options:variant_options(*)
        `
        )
        .is("deleted_at", null)
        .order("sort_order")

      if (error) throw error

      // Sort options within each type
      const sorted = (data ?? []).map((vt) => ({
        ...vt,
        variant_options: [...(vt.variant_options ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      }))

      return sorted as unknown as VariantTypeWithOptions[]
    },
  })
}
