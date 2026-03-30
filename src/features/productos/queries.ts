"use client"

// TODO: Replace mock data with real Supabase queries via createBrowserClient

import { useQuery } from "@tanstack/react-query"

import { mockProducts, mockCategories, mockVariantTypes } from "./mock-data"
import type {
  ProductWithDetails,
  CategoryWithCount,
  VariantTypeWithOptions,
} from "./types"

// --- PRODUCTS ---

interface ProductFilters {
  search?: string
  categoryId?: string
  brand?: string
  isActive?: boolean
}

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async (): Promise<ProductWithDetails[]> => {
      // Mock: filter in memory
      let results = [...mockProducts]

      if (filters?.search) {
        const q = filters.search.toLowerCase()
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.brand?.toLowerCase().includes(q) ?? false) ||
            p.product_variants.some((v) =>
              v.sku?.toLowerCase().includes(q)
            )
        )
      }

      if (filters?.categoryId) {
        results = results.filter((p) => p.category_id === filters.categoryId)
      }

      if (filters?.brand) {
        results = results.filter((p) => p.brand === filters.brand)
      }

      if (filters?.isActive !== undefined) {
        results = results.filter((p) => p.is_active === filters.isActive)
      }

      return results
    },
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async (): Promise<ProductWithDetails | null> => {
      return mockProducts.find((p) => p.id === id) ?? null
    },
    enabled: !!id,
  })
}

// --- CATEGORIES ---

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      return mockCategories
    },
  })
}

// --- VARIANT TYPES ---

export function useVariantTypes() {
  return useQuery({
    queryKey: ["variant-types"],
    queryFn: async (): Promise<VariantTypeWithOptions[]> => {
      return mockVariantTypes
    },
  })
}
