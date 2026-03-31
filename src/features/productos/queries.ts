"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

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
          categories:categories(id, name),
          product_variants:product_variants!product_variants_product_id_fkey(
            *,
            variant_option_assignments:variant_option_assignments(
              variant_options:variant_options(
                *,
                variant_types:variant_types(id, name)
              )
            )
          ),
          product_images:product_images(id, storage_path, sort_order)`
        )
        .is("deleted_at", null)
        .is("product_variants.deleted_at", null)
        .order("name")

      if (filters?.search) {
        const q = filters.search.trim()

        // Find product IDs that have a variant matching the SKU
        const { data: skuMatches } = await supabase
          .from("product_variants")
          .select("product_id")
          .ilike("sku", `%${q}%`)
          .is("deleted_at", null)

        const skuProductIds = [...new Set((skuMatches ?? []).map((m) => m.product_id))]

        if (skuProductIds.length > 0) {
          query = query.or(
            `name.ilike.%${q}%,brand.ilike.%${q}%,id.in.(${skuProductIds.join(",")})`
          )
        } else {
          query = query.or(
            `name.ilike.%${q}%,brand.ilike.%${q}%`
          )
        }
      }

      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        query = query.in("category_id", filters.categoryIds)
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
          categories:categories(id, name),
          product_variants:product_variants!product_variants_product_id_fkey(
            *,
            variant_option_assignments:variant_option_assignments(
              variant_options:variant_options(
                *,
                variant_types:variant_types(id, name)
              )
            )
          ),
          product_images:product_images(id, storage_path, sort_order)`
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

// --- CATEGORIES ---

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("categories")
        .select("*, products(count)")
        .is("deleted_at", null)
        .order("sort_order")
        .order("name")

      if (error) throw error
      return (data ?? []) as unknown as CategoryWithCount[]
    },
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
