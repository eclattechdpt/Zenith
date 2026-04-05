"use client"

import { useState } from "react"
import { Search, Check, Package, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useDebounce } from "@/hooks/use-debounce"
import { usePOSProducts, type POSProduct } from "@/features/pos/queries"
import { formatCurrency } from "@/lib/utils"

// ── Color hash for thumbnails ──

const THUMB_COLORS = [
  { bg: "bg-rose-50", text: "text-rose-200" },
  { bg: "bg-teal-50", text: "text-teal-200" },
  { bg: "bg-amber-50", text: "text-amber-200" },
  { bg: "bg-blue-50", text: "text-blue-200" },
]

function getThumbColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = hash + name.charCodeAt(i)
  return THUMB_COLORS[hash % THUMB_COLORS.length]
}

// ── Types ──

interface ProductWithImage extends POSProduct {
  image_url?: string | null
}

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

  const searchQuery = usePOSProducts(debouncedSearch)

  // Fetch initial product list with images
  const allProductsQuery = useQuery({
    queryKey: ["transit-all-products"],
    queryFn: async (): Promise<ProductWithImage[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .select(
          `id, name, brand, has_variants, image_url,
          product_variants:product_variants!product_variants_product_id_fkey(
            id, sku, name, price, cost, stock, is_active
          )`
        )
        .is("deleted_at", null)
        .eq("is_active", true)
        .is("product_variants.deleted_at", null)
        .order("name")
        .limit(30)
      if (error) throw error
      return (data ?? []) as unknown as ProductWithImage[]
    },
    enabled: !debouncedSearch.trim(),
  })

  const isSearching = debouncedSearch.trim().length > 0
  const products: ProductWithImage[] = isSearching
    ? (searchQuery.data ?? [])
    : (allProductsQuery.data ?? [])
  const isLoading = isSearching ? searchQuery.isLoading : allProductsQuery.isLoading

  return (
    <div className="space-y-3">
      {selected ? (
        /* ── Selected product card ── */
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <Check className="size-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-blue-900 truncate">
              {selected.name}
            </p>
            <p className="text-[11px] text-blue-600 tabular-nums">
              {formatCurrency(selected.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClear?.()
              setSearch("")
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        /* ── Search + product list ── */
        <>
          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre, marca o codigo..."
              className="h-10 w-full rounded-xl border border-blue-200/80 bg-blue-50/30 pl-10 pr-4 text-[13px] font-medium text-neutral-700 outline-none transition-colors duration-150 placeholder:text-neutral-400 focus:border-blue-300 focus:ring-3 focus:ring-blue-500/20"
              autoFocus
            />
            <AnimatePresence>
              {search.length > 0 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-neutral-300 transition-colors hover:text-neutral-500"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Product list */}
          <div className="max-h-64 overflow-y-auto rounded-xl border border-neutral-100 bg-white">
            {isLoading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-neutral-50"
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-8">
                <Package className="h-5 w-5 text-neutral-300" />
                <p className="text-[12px] font-semibold text-neutral-400">
                  {isSearching ? "Sin resultados" : "Sin productos"}
                </p>
                {isSearching && (
                  <p className="text-[11px] text-neutral-400/70">Intenta con otro termino</p>
                )}
              </div>
            ) : (
              <div className="p-1.5">
                {products.map((product) => (
                  <ProductVariantList
                    key={product.id}
                    product={product}
                    excludeVariantIds={excludeVariantIds}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </div>
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
  product: ProductWithImage
  excludeVariantIds: string[]
  onSelect: (variant: { id: string; name: string; price: number }) => void
}) {
  const variants = product.product_variants.filter(
    (v) => v.is_active && !excludeVariantIds.includes(v.id)
  )

  if (variants.length === 0) return null

  const palette = getThumbColor(product.name)
  const initials = product.name.slice(0, 2).toUpperCase()

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
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-blue-50/50"
          >
            {/* Thumbnail */}
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg ${palette.bg}`}>
              {product.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className={`text-[13px] font-black ${palette.text}`}>
                  {initials}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-neutral-800 truncate">
                {label}
              </p>
              <p className="text-[11px] text-neutral-400 tabular-nums">
                {v.sku && <span className="text-neutral-300">{v.sku} · </span>}
                {formatCurrency(v.price)}
                {v.stock > 0 && (
                  <span className="ml-1.5 text-neutral-300">· {v.stock} en stock</span>
                )}
              </p>
            </div>

            {/* Select indicator */}
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 text-transparent transition-colors group-hover:border-blue-300">
              <Check className="size-3" />
            </div>
          </button>
        )
      })}
    </>
  )
}
