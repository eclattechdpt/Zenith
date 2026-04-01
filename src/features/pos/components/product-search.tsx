"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Package, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useDebounce } from "@/hooks/use-debounce"

import { usePOSProducts, type POSProduct } from "../queries"
import { usePOSStore } from "../store"
import { resolvePrice } from "../utils"
import type { CartCustomer } from "../types"

function useAllPOSProducts() {
  return useQuery({
    queryKey: ["pos-all-products"],
    queryFn: async (): Promise<POSProduct[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .select(
          `id, name, brand, has_variants,
          product_variants:product_variants!product_variants_product_id_fkey(
            id, sku, name, price, cost, stock, is_active
          )`
        )
        .is("deleted_at", null)
        .eq("is_active", true)
        .is("product_variants.deleted_at", null)
        .order("name")
      if (error) throw error
      return (data ?? []) as unknown as POSProduct[]
    },
  })
}

export function ProductSearch() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 250)
  const searchQuery = usePOSProducts(debouncedSearch)
  const allQuery = useAllPOSProducts()

  const isSearching = debouncedSearch.trim().length > 0
  const products = isSearching ? searchQuery.data ?? [] : allQuery.data ?? []
  const isLoading = isSearching ? searchQuery.isLoading : allQuery.isLoading

  const customer = usePOSStore((s) => s.customer)
  const addItem = usePOSStore((s) => s.addItem)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep focus on search for fast scanning/typing
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSelectVariant(
    product: POSProduct,
    variant: POSProduct["product_variants"][number]
  ) {
    if (variant.stock <= 0) {
      toast.error("Sin stock disponible")
      return
    }

    const existingItem = usePOSStore.getState().items.find(
      (i) => i.variantId === variant.id
    )
    if (existingItem && existingItem.quantity >= variant.stock) {
      toast.error(`Stock maximo alcanzado (${variant.stock})`)
      return
    }

    const price = await resolvePrice(
      variant.id,
      Number(variant.price),
      customer?.priceListId ?? null,
      customer?.discountPercent ?? 0
    )

    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      variantLabel: variant.name ?? product.name,
      sku: variant.sku,
      unitPrice: price,
      unitCost: Number(variant.cost),
      stock: variant.stock,
    })

    setSearch("")
    inputRef.current?.focus()
  }

  function handleSelectProduct(product: POSProduct) {
    const activeVariants = product.product_variants.filter((v) => v.is_active)

    // Simple product (1 variant) — add directly
    if (activeVariants.length === 1) {
      handleSelectVariant(product, activeVariants[0])
      return
    }

    // Multiple variants — show variant picker (handled in the results list)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
        <Input
          ref={inputRef}
          placeholder="Buscar producto, marca o codigo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 text-base"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 animate-spin" />
        )}
      </div>

      {/* Results */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Loader2 className="size-6 text-neutral-300 animate-spin" />
            <p className="text-sm text-neutral-400">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Package className="size-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">
              {isSearching ? "No se encontraron productos" : "Sin productos disponibles"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {products.map((product) => (
              <ProductResultItem
                key={product.id}
                product={product}
                customer={customer}
                onSelectProduct={handleSelectProduct}
                onSelectVariant={(variant) =>
                  handleSelectVariant(product, variant)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductResultItem({
  product,
  customer,
  onSelectProduct,
  onSelectVariant,
}: {
  product: POSProduct
  customer: CartCustomer | null
  onSelectProduct: (product: POSProduct) => void
  onSelectVariant: (variant: POSProduct["product_variants"][number]) => void
}) {
  const activeVariants = product.product_variants.filter((v) => v.is_active)
  const isSingleVariant = !product.has_variants && activeVariants.length === 1
  const [expanded, setExpanded] = useState(false)

  if (isSingleVariant) {
    const variant = activeVariants[0]
    const outOfStock = variant.stock <= 0
    return (
      <button
        type="button"
        onClick={() => onSelectProduct(product)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${outOfStock ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-50"}`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-950 truncate">
            {product.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {product.brand && (
              <span className="text-xs text-neutral-400">{product.brand}</span>
            )}
            {variant.sku && (
              <span className="text-xs text-neutral-400">{variant.sku}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-neutral-950">
            {formatCurrency(Number(variant.price))}
          </p>
          <p className="text-xs text-neutral-400">
            Stock: {variant.stock}
          </p>
        </div>
      </button>
    )
  }

  // Product with multiple variants
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-950 truncate">
            {product.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {product.brand && (
              <span className="text-xs text-neutral-400">{product.brand}</span>
            )}
            <Badge variant="secondary" className="text-[10px]">
              {activeVariants.length} variante{activeVariants.length !== 1 && "s"}
            </Badge>
          </div>
        </div>
        <span className="text-xs text-neutral-400">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/50">
          {activeVariants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelectVariant(variant)}
              className="flex w-full items-center gap-3 px-4 py-2.5 pl-8 text-left transition-colors hover:bg-neutral-100"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-700 truncate">
                  {variant.name ?? variant.sku ?? "Variante"}
                </p>
                {variant.sku && variant.name && (
                  <span className="text-xs text-neutral-400">{variant.sku}</span>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-neutral-950">
                  {formatCurrency(Number(variant.price))}
                </p>
                <p className="text-xs text-neutral-400">
                  Stock: {variant.stock}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
