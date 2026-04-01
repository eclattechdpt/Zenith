"use client"

import { useState, useMemo, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Search, Trash2, Loader2, Tag, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { NumericInput } from "@/features/productos/components/variant-manager"
import { formatCurrency } from "@/lib/utils"

import { useCustomerPrices } from "../queries"
import { setCustomerPrice, removeCustomerPrice } from "../actions"
import type { PriceList, CustomerPriceWithDetails } from "../types"
import { useProducts } from "@/features/productos/queries"

interface CustomerPriceEditorProps {
  priceList: PriceList
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerPriceEditor({
  priceList,
  open,
  onOpenChange,
}: CustomerPriceEditorProps) {
  const queryClient = useQueryClient()
  const { data: customerPrices = [], isLoading } = useCustomerPrices(
    open ? priceList.id : null
  )
  const { data: products = [] } = useProducts()

  const [search, setSearch] = useState("")
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    label: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Build a set of variant IDs that already have overrides
  const overriddenVariantIds = useMemo(
    () => new Set(customerPrices.map((cp) => cp.product_variant_id)),
    [customerPrices]
  )

  // Filter products for the "add" search
  const filteredVariants = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase().trim()

    const results: {
      variantId: string
      productName: string
      brand: string | null
      variantName: string | null
      sku: string | null
      basePrice: number
    }[] = []

    for (const product of products) {
      if (!product.product_variants) continue
      const nameMatch = product.name.toLowerCase().includes(q)
      const brandMatch = product.brand?.toLowerCase().includes(q)

      for (const variant of product.product_variants) {
        if (variant.deleted_at) continue
        if (!variant.is_active) continue
        if (overriddenVariantIds.has(variant.id)) continue

        const skuMatch = variant.sku?.toLowerCase().includes(q)
        const variantNameMatch = variant.name?.toLowerCase().includes(q)

        if (nameMatch || brandMatch || skuMatch || variantNameMatch) {
          results.push({
            variantId: variant.id,
            productName: product.name,
            brand: product.brand,
            variantName: variant.name,
            sku: variant.sku,
            basePrice: Number(variant.price),
          })
        }
      }

      if (results.length >= 20) break
    }

    return results
  }, [search, products, overriddenVariantIds])

  async function handleSetPrice(variantId: string, price: number) {
    setSavingVariantId(variantId)
    const result = await setCustomerPrice({
      price_list_id: priceList.id,
      product_variant_id: variantId,
      price,
    })
    setSavingVariantId(null)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al guardar precio"
      toast.error(msg)
      return
    }

    toast.success("Precio guardado")
    queryClient.invalidateQueries({ queryKey: ["customer-prices", priceList.id] })
    setSearch("")
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await removeCustomerPrice(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al eliminar"
      toast.error(msg)
      return
    }

    toast.success("Precio eliminado")
    queryClient.invalidateQueries({ queryKey: ["customer-prices", priceList.id] })
  }

  async function handleUpdatePrice(cp: CustomerPriceWithDetails, newPrice: number) {
    if (newPrice <= 0 || newPrice === Number(cp.price)) return
    setSavingVariantId(cp.product_variant_id)
    const result = await setCustomerPrice({
      price_list_id: priceList.id,
      product_variant_id: cp.product_variant_id,
      price: newPrice,
    })
    setSavingVariantId(null)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al actualizar"
      toast.error(msg)
      return
    }

    toast.success("Precio actualizado")
    queryClient.invalidateQueries({ queryKey: ["customer-prices", priceList.id] })
  }

  function variantLabel(cp: CustomerPriceWithDetails) {
    const pv = cp.product_variants
    if (!pv) return "Variante eliminada"
    const product = pv.products?.name ?? "Producto"
    const parts = [product]
    if (pv.name) parts.push(pv.name)
    if (pv.sku) parts.push(`(${pv.sku})`)
    return parts.join(" — ")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="size-4" />
              Precios: {priceList.name}
            </DialogTitle>
            <p className="text-xs text-neutral-500">
              {Number(priceList.discount_percent) > 0
                ? `Descuento base: ${priceList.discount_percent}%. Los precios especificos tienen prioridad sobre el descuento.`
                : "Sin descuento base. Agrega precios especificos por variante."}
            </p>
          </DialogHeader>

          {/* Search to add new overrides */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
            <Input
              placeholder="Buscar producto para agregar precio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Search results */}
          {search.trim() && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-input divide-y divide-neutral-100">
              {filteredVariants.length === 0 ? (
                <p className="px-4 py-3 text-sm text-neutral-500">
                  No se encontraron productos
                </p>
              ) : (
                filteredVariants.map((v) => (
                  <SearchResultRow
                    key={v.variantId}
                    variant={v}
                    discountPercent={Number(priceList.discount_percent)}
                    isSaving={savingVariantId === v.variantId}
                    onSetPrice={(price) => handleSetPrice(v.variantId, price)}
                  />
                ))
              )}
            </div>
          )}

          {/* Existing overrides */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-neutral-400" />
              </div>
            ) : customerPrices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Tag className="size-8 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">
                  Sin precios especificos
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Busca un producto arriba para agregar un precio
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                <p className="text-xs font-medium text-neutral-500 px-1 pb-2">
                  {customerPrices.length} precio{customerPrices.length !== 1 && "s"} especifico{customerPrices.length !== 1 && "s"}
                </p>
                {customerPrices.map((cp) => (
                  <OverrideRow
                    key={cp.id}
                    customerPrice={cp}
                    isSaving={savingVariantId === cp.product_variant_id}
                    onUpdate={(price) => handleUpdatePrice(cp, price)}
                    onDelete={() =>
                      setDeleteTarget({
                        id: cp.id,
                        label: variantLabel(cp),
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar precio especifico"
        description={`Se eliminara el precio de "${deleteTarget?.label}". Se usara el descuento general o el precio base.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  )
}

// --- Sub-components ---

function SearchResultRow({
  variant,
  discountPercent,
  isSaving,
  onSetPrice,
}: {
  variant: {
    variantId: string
    productName: string
    brand: string | null
    variantName: string | null
    sku: string | null
    basePrice: number
  }
  discountPercent: number
  isSaving: boolean
  onSetPrice: (price: number) => void
}) {
  const suggestedPrice =
    discountPercent > 0
      ? Math.round(variant.basePrice * (1 - discountPercent / 100) * 100) / 100
      : variant.basePrice

  const [price, setPrice] = useState(suggestedPrice)
  const priceRef = useRef(suggestedPrice)

  function handlePriceChange(v: number) {
    setPrice(v)
    priceRef.current = v
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-950 truncate">
          {variant.productName}
          {variant.variantName && (
            <span className="text-neutral-500"> — {variant.variantName}</span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {variant.sku && (
            <span className="text-[10px] text-neutral-400">{variant.sku}</span>
          )}
          <span className="text-[10px] text-neutral-400">
            Base: {formatCurrency(variant.basePrice)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-24">
          <NumericInput
            decimal
            min={0.01}
            step="0.01"
            value={price}
            onChange={handlePriceChange}
            prefix="$"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={isSaving || price <= 0}
          onMouseDown={() => {
            // Force blur on NumericInput so it commits via handlePriceChange
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur()
            }
          }}
          onClick={() => onSetPrice(priceRef.current)}
          className="text-xs"
        >
          {isSaving ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            "Agregar"
          )}
        </Button>
      </div>
    </div>
  )
}

function OverrideRow({
  customerPrice,
  isSaving,
  onUpdate,
  onDelete,
}: {
  customerPrice: CustomerPriceWithDetails
  isSaving: boolean
  onUpdate: (price: number) => void
  onDelete: () => void
}) {
  const pv = customerPrice.product_variants
  const basePrice = pv?.price ?? 0
  const [price, setPrice] = useState(Number(customerPrice.price))
  const priceRef = useRef(Number(customerPrice.price))
  const [editing, setEditing] = useState(false)

  function handlePriceChange(v: number) {
    setPrice(v)
    priceRef.current = v
  }

  const discount =
    basePrice > 0
      ? Math.round((1 - Number(customerPrice.price) / basePrice) * 100)
      : 0

  return (
    <div className="flex items-center gap-3 px-1 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-950 truncate">
          {pv?.products?.name ?? "Producto eliminado"}
          {pv?.name && (
            <span className="text-neutral-500"> — {pv.name}</span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {pv?.sku && (
            <span className="text-[10px] text-neutral-400">{pv.sku}</span>
          )}
          <span className="text-[10px] text-neutral-400">
            Base: {formatCurrency(basePrice)}
          </span>
          {discount > 0 && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              -{discount}%
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <div className="w-24">
              <NumericInput
                decimal
                min={0.01}
                step="0.01"
                value={price}
                onChange={handlePriceChange}
                prefix="$"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isSaving || price <= 0}
              onMouseDown={() => {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur()
                }
              }}
              onClick={() => {
                onUpdate(priceRef.current)
                setEditing(false)
              }}
              className="text-xs"
            >
              {isSaving ? <Loader2 className="size-3 animate-spin" /> : "OK"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPrice(Number(customerPrice.price))
                setEditing(false)
              }}
              className="text-xs"
            >
              <X className="size-3" />
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-neutral-950 hover:text-teal-600 transition-colors cursor-pointer"
            >
              {formatCurrency(Number(customerPrice.price))}
            </button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onDelete}
            >
              <Trash2 className="size-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
