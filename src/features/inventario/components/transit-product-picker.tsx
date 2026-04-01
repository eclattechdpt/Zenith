"use client"

import { useState } from "react"
import { Search, Check } from "lucide-react"

import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { usePOSProducts, type POSProduct } from "@/features/pos/queries"

interface TransitProductPickerProps {
  excludeVariantIds?: string[]
  onSelect: (variant: { id: string; name: string; price: number }) => void
  onClear?: () => void
  selected: { id: string; name: string; price: number } | null
}

export function TransitProductPicker({
  excludeVariantIds = [],
  onSelect,
  onClear,
  selected,
}: TransitProductPickerProps) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 250)

  const { data: products = [], isLoading } = usePOSProducts(debouncedSearch)

  return (
    <div className="space-y-2">
      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <span className="text-sm font-medium text-blue-800">
            {selected.name}
          </span>
          <button
            type="button"
            onClick={() => {
              onClear?.()
              setSearch("")
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Buscar producto por nombre, marca o codigo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {debouncedSearch.trim().length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-100 bg-white">
              {isLoading ? (
                <div className="px-3 py-4 text-center text-xs text-neutral-400">
                  Buscando...
                </div>
              ) : products.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-neutral-400">
                  Sin resultados
                </div>
              ) : (
                products.map((product) => (
                  <ProductVariantList
                    key={product.id}
                    product={product}
                    excludeVariantIds={excludeVariantIds}
                    onSelect={onSelect}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ProductVariantList({
  product,
  excludeVariantIds,
  onSelect,
}: {
  product: POSProduct
  excludeVariantIds: string[]
  onSelect: (variant: { id: string; name: string; price: number }) => void
}) {
  const variants = product.product_variants.filter(
    (v) => v.is_active && !excludeVariantIds.includes(v.id)
  )

  if (variants.length === 0) return null

  return (
    <>
      {variants.map((v) => {
        const label = product.has_variants
          ? `${product.name} — ${v.name || v.sku || "Variante"}`
          : product.name

        return (
          <button
            key={v.id}
            type="button"
            onClick={() =>
              onSelect({ id: v.id, name: label, price: v.price })
            }
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-neutral-800 truncate">{label}</p>
              <p className="text-xs text-neutral-400">
                {v.sku && `${v.sku} · `}${new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(v.price)}
              </p>
            </div>
            <Check className="size-3.5 shrink-0 text-transparent" />
          </button>
        )
      })}
    </>
  )
}
