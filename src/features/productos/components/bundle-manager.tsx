"use client"

import { useMemo, useState } from "react"
import { Plus, Trash2, Search, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import { useProducts, useVariantsByIds } from "../queries"
import type { BundleItemInput } from "../schemas"

interface BundleManagerProps {
  items: BundleItemInput[]
  onChange: (items: BundleItemInput[]) => void
}

export function BundleManager({ items, onChange }: BundleManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null)

  // Resolve info for variants currently in the bundle — independent of search
  const itemIds = useMemo(
    () => items.map((i) => i.product_variant_id),
    [items]
  )
  const { data: bundleVariants = [] } = useVariantsByIds(itemIds)

  // Products for the search picker — only used when adding a new item
  const { data: products = [] } = useProducts({
    search: searchQuery || undefined,
    isActive: true,
  })

  // Filter out products already in the bundle and bundles themselves
  const availableProducts = products.filter(
    (p) =>
      !p.is_bundle &&
      p.product_variants.some(
        (v) => v.is_active && !items.some((bi) => bi.product_variant_id === v.id)
      )
  )

  function addItem(variant: { id: string }) {
    onChange([...items, { product_variant_id: variant.id }])
    setShowSearch(false)
    setSearchQuery("")
  }

  function removeItem(variantId: string) {
    onChange(items.filter((i) => i.product_variant_id !== variantId))
  }

  // Resolve variant info from the dedicated query (never affected by search)
  function getVariantInfo(variantId: string) {
    const v = bundleVariants.find((bv) => bv.id === variantId)
    if (!v) return null
    const optionLabel = v.option_values.join(" / ")
    return {
      productName: v.product?.name ?? "Producto",
      brand: v.product?.brand ?? null,
      variantLabel: optionLabel || v.name || v.sku || "Unica",
      sku: v.sku,
      price: v.price,
      stock: v.stock,
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Current bundle items */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const info = getVariantInfo(item.product_variant_id)
            return (
              <div
                key={item.product_variant_id}
                className="flex items-center gap-3 rounded-lg border border-input px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-950">
                    {info?.productName ?? "Producto"}
                    {info?.brand && (
                      <span className="ml-1 text-xs text-neutral-500">
                        {info.brand}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {info?.variantLabel}
                    {info?.sku && ` · ${info.sku}`}
                  </p>
                </div>
                {info && (
                  <span
                    className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      info.stock === 0
                        ? "bg-rose-50 text-rose-600"
                        : info.stock <= 5
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {info.stock === 0 ? "Sin stock" : `${info.stock} en stock`}
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setDeleteVariantId(item.product_variant_id)}
                >
                  <Trash2 className="size-3.5 text-neutral-400" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {items.length === 0 && !showSearch && (
        <EmptyState
          icon={Package}
          title="Sin productos"
          description="Agrega los productos que incluye este cofre."
          className="py-6"
        />
      )}

      {/* Search to add products */}
      {showSearch ? (
        <div className="rounded-lg border border-input p-3">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {availableProducts.length === 0 ? (
              <p className="py-3 text-center text-xs text-neutral-500">
                {searchQuery
                  ? "Sin resultados"
                  : "No hay productos disponibles"}
              </p>
            ) : (
              availableProducts.map((product) =>
                product.product_variants
                  .filter((v) => v.is_active)
                  .map((variant) => {
                    const optionLabel = variant.variant_option_assignments
                      .map((a) => a.variant_options?.value)
                      .filter(Boolean)
                      .join(" / ")
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => addItem(variant)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-neutral-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            {product.name}
                            {product.brand && (
                              <span className="ml-1 text-xs text-neutral-500">
                                {product.brand}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {optionLabel || variant.name || variant.sku || "Variante unica"}
                            {" · "}Stock: {variant.stock}
                          </p>
                        </div>
                        <Plus className="size-4 shrink-0 text-neutral-400" />
                      </button>
                    )
                  })
              )
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="mt-1 w-full"
            onClick={() => {
              setShowSearch(false)
              setSearchQuery("")
            }}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSearch(true)}
        >
          <Plus className="mr-1.5 size-3.5" />
          Agregar producto al cofre
        </Button>
      )}

      <ConfirmDialog
        open={deleteVariantId !== null}
        onOpenChange={(open) => !open && setDeleteVariantId(null)}
        title="Quitar producto del cofre"
        description={`Se quitara "${deleteVariantId ? (getVariantInfo(deleteVariantId)?.productName ?? "este producto") : ""}" del cofre.`}
        confirmLabel="Quitar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => {
          if (deleteVariantId) {
            removeItem(deleteVariantId)
            setDeleteVariantId(null)
          }
        }}
      />
    </div>
  )
}
