"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { useCategories } from "@/features/productos/queries"
import { useAllPOSProducts } from "../queries"
import type { POSProductWithImage } from "../queries"
import { POSProductCard } from "./pos-product-card"

interface POSProductGridProps {
  onAdd: (product: POSProductWithImage) => void
}

export function POSProductGrid({ onAdd }: POSProductGridProps) {
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search, 250)

  const { data: categories } = useCategories()
  const { data: products, isLoading } = useAllPOSProducts(debouncedSearch, categoryId)

  return (
    <div className="border-t border-neutral-200 pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="whitespace-nowrap text-base font-semibold text-neutral-800">Todos los productos</h2>
        <div className="flex gap-2">
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs text-neutral-600"
          >
            <option value="">Todas las categorias</option>
            {(categories ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="h-8 w-48 pl-7 text-xs"
            />
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : (products ?? []).length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-neutral-400">
          No se encontraron productos
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(products ?? []).map((product) => (
            <POSProductCard key={product.id} product={product} onAdd={onAdd} />
          ))}
        </div>
      )}
    </div>
  )
}
