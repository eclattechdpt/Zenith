"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import { useCategories } from "@/features/productos/queries"
import { useCustomers } from "@/features/clientes/queries"
import { usePriceLists } from "@/features/clientes/queries"
import { useMediaItems, useMediaStats } from "@/features/media/queries"

// ---------------------------------------------------------------------------
// Categorías stats
// ---------------------------------------------------------------------------

export interface CategoriaStats {
  totalCategorias: number
  totalSubcategorias: number
  productosSinCategoria: number
}

export function useCategoriaStats() {
  const { data: categories, isLoading: catLoading } = useCategories()

  return useQuery({
    queryKey: ["config-stats", "categorias", categories?.length],
    queryFn: async (): Promise<CategoriaStats> => {
      const supabase = createClient()

      // Count products without any category assignment
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)

      const { count: withCategory } = await supabase
        .from("product_categories")
        .select("product_id", { count: "exact", head: true })

      const parents = (categories ?? []).filter((c) => !c.parent_id)
      const children = (categories ?? []).filter((c) => !!c.parent_id)

      // Deduplicate product_ids that have categories
      const sinCategoria = Math.max(0, (totalProducts ?? 0) - (withCategory ?? 0))

      return {
        totalCategorias: parents.length,
        totalSubcategorias: children.length,
        productosSinCategoria: sinCategoria,
      }
    },
    enabled: !catLoading,
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// Descuentos stats
// ---------------------------------------------------------------------------

export interface DescuentoStats {
  totalListas: number
  clientesConDescuento: number
  descuentoPromedio: number
}

export function useDescuentoStats() {
  const { data: priceLists, isLoading: plLoading } = usePriceLists()
  const { data: customers, isLoading: custLoading } = useCustomers()

  const isReady = !plLoading && !custLoading

  return useQuery({
    queryKey: ["config-stats", "descuentos", priceLists?.length, customers?.length],
    queryFn: async (): Promise<DescuentoStats> => {
      const lists = priceLists ?? []
      const custs = customers ?? []

      const totalListas = lists.length
      const clientesConDescuento = custs.filter((c) => c.price_lists !== null).length

      const descuentoPromedio =
        totalListas > 0
          ? lists.reduce((sum, l) => sum + (l.discount_percent ?? 0), 0) / totalListas
          : 0

      return { totalListas, clientesConDescuento, descuentoPromedio }
    },
    enabled: isReady,
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// Imágenes stats
// ---------------------------------------------------------------------------

export interface ImagenStats {
  totalArchivos: number
  conImagen: number
  sinImagen: number
}

export function useImagenStats() {
  const { data: items, isLoading } = useMediaItems()
  const stats = useMediaStats(items)

  return useQuery({
    queryKey: ["config-stats", "imagenes", items?.length],
    queryFn: async (): Promise<ImagenStats> => {
      return {
        totalArchivos: stats.total,
        conImagen: stats.withImage,
        sinImagen: stats.withoutImage,
      }
    },
    enabled: !isLoading,
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// Dev stats
// ---------------------------------------------------------------------------

export interface DevStats {
  estado: "ok" | "error"
  latenciaMs: number
  registrosTotales: number
  breakdown: {
    products: number
    productVariants: number
    customers: number
    sales: number
    inventoryMovements: number
  }
}

export function useDevStats() {
  return useQuery({
    queryKey: ["config-stats", "dev"],
    queryFn: async (): Promise<DevStats> => {
      const supabase = createClient()
      const start = Date.now()

      const { error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })

      const latenciaMs = Date.now() - start

      const emptyBreakdown = { products: 0, productVariants: 0, customers: 0, sales: 0, inventoryMovements: 0 }

      if (error) {
        return { estado: "error", latenciaMs, registrosTotales: 0, breakdown: emptyBreakdown }
      }

      const [
        { count: products },
        { count: productVariants },
        { count: customers },
        { count: sales },
        { count: inventoryMovements },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("product_variants").select("*", { count: "exact", head: true }),
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("sales").select("*", { count: "exact", head: true }),
        supabase.from("inventory_movements").select("*", { count: "exact", head: true }),
      ])

      const breakdown = {
        products: products ?? 0,
        productVariants: productVariants ?? 0,
        customers: customers ?? 0,
        sales: sales ?? 0,
        inventoryMovements: inventoryMovements ?? 0,
      }

      const registrosTotales = Object.values(breakdown).reduce((a, b) => a + b, 0)

      return { estado: "ok", latenciaMs, registrosTotales, breakdown }
    },
    staleTime: 60_000,
  })
}
