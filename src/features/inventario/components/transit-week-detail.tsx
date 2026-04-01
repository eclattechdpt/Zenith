"use client"

import { useState } from "react"
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/utils"

import { useTransitWeekDetail } from "../queries"
import {
  addTransitWeekItem,
  updateTransitWeekItem,
  deleteTransitWeekItem,
} from "../actions"
import type { TransitWeekItemWithProduct } from "../types"
import { TransitProductPicker } from "./transit-product-picker"

interface TransitWeekDetailProps {
  weekId: string | null
  onClose?: () => void
}

export function TransitWeekDetail({ weekId }: TransitWeekDetailProps) {
  const { data: week, isLoading } = useTransitWeekDetail(weekId)
  const [showAddItem, setShowAddItem] = useState(false)
  const [editItem, setEditItem] = useState<TransitWeekItemWithProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TransitWeekItemWithProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  if (!weekId) return null

  const items = week?.transit_week_items ?? []

  async function handleDeleteItem() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteTransitWeekItem(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result && result.error) {
      toast.error("Error al eliminar el producto")
      return
    }

    toast.success("Producto eliminado de la semana")
    queryClient.invalidateQueries({ queryKey: ["transit-week"] })
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["transit-month-summary"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
  }

  return (
    <div className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/20 p-4 shadow-sm sm:p-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-neutral-400">
          Cargando...
        </div>
      ) : week ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-950">
                Semana {week.week_number}, {week.year}
              </h3>
              {week.label && (
                <p className="text-xs text-neutral-500">{week.label}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-950 tabular-nums">
                {formatCurrency(Number(week.total_value))}
              </span>
              <Button size="sm" onClick={() => setShowAddItem(true)}>
                <Plus className="size-3.5" />
                Agregar producto
              </Button>
            </div>
          </div>

          {/* Items list */}
          {items.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Sin productos"
              description="Agrega productos que llegaron esta semana."
            />
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-800 truncate">
                      {item.product_variants.products.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {item.product_variants.name || item.product_variants.sku || "—"}
                      {item.product_variants.products.brand &&
                        ` · ${item.product_variants.products.brand}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-neutral-950 tabular-nums">
                      {item.quantity} × {formatCurrency(Number(item.unit_price))}
                    </p>
                    <p className="text-xs text-neutral-500 tabular-nums">
                      {formatCurrency(Number(item.line_total))}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-neutral-400 hover:text-neutral-700"
                      onClick={() => setEditItem(item)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-neutral-400 hover:text-rose-600"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* Add item dialog */}
      <AddTransitItemDialog
        open={showAddItem}
        weekId={weekId}
        existingVariantIds={items.map((i) => i.product_variant_id)}
        onOpenChange={setShowAddItem}
      />

      {/* Edit item dialog */}
      <EditTransitItemDialog
        item={editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar producto"
        description={`Se eliminara "${deleteTarget?.product_variants.products.name}" de esta semana.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteItem}
      />
    </div>
  )
}

// ── Add item dialog ──

function AddTransitItemDialog({
  open,
  weekId,
  existingVariantIds,
  onOpenChange,
}: {
  open: boolean
  weekId: string
  existingVariantIds: string[]
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <AddTransitItemForm
          weekId={weekId}
          existingVariantIds={existingVariantIds}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  )
}

function AddTransitItemForm({
  weekId,
  existingVariantIds,
  onOpenChange,
}: {
  weekId: string
  existingVariantIds: string[]
  onOpenChange: (open: boolean) => void
}) {
  const [selectedVariant, setSelectedVariant] = useState<{
    id: string
    name: string
    price: number
  } | null>(null)
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const parsedQty = parseInt(quantity, 10)
  const parsedPrice = parseFloat(unitPrice)
  const isValid =
    selectedVariant &&
    !isNaN(parsedQty) &&
    parsedQty > 0 &&
    !isNaN(parsedPrice) &&
    parsedPrice >= 0

  async function handleSubmit() {
    if (!isValid || !selectedVariant) return
    setIsSubmitting(true)

    const result = await addTransitWeekItem({
      transit_week_id: weekId,
      product_variant_id: selectedVariant.id,
      quantity: parsedQty,
      unit_price: parsedPrice,
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al agregar producto"
      toast.error(msg)
      return
    }

    toast.success("Producto agregado")
    queryClient.invalidateQueries({ queryKey: ["transit-week"] })
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["transit-month-summary"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    onOpenChange(false)
  }

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Agregar producto</DialogTitle>
        <DialogDescription>
          Selecciona un producto que llego esta semana
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <TransitProductPicker
          excludeVariantIds={existingVariantIds}
          onSelect={(variant) => {
            setSelectedVariant(variant)
            setUnitPrice(String(variant.price))
          }}
          onClear={() => {
            setSelectedVariant(null)
            setUnitPrice("")
            setQuantity("")
          }}
          selected={selectedVariant}
        />

        {selectedVariant && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="item-qty">Cantidad</Label>
                <Input
                  id="item-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ej: 10"
                  className="tabular-nums"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">Precio unitario</Label>
                <Input
                  id="item-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="tabular-nums"
                />
              </div>
            </div>

            {isValid && (
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
                <span className="text-sm">Total</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(parsedQty * parsedPrice)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button disabled={!isValid || isSubmitting} onClick={handleSubmit}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Agregar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Edit item dialog ──

function EditTransitItemDialog({
  item,
  onOpenChange,
}: {
  item: TransitWeekItemWithProduct | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      {item && <EditTransitItemForm item={item} onOpenChange={onOpenChange} />}
    </Dialog>
  )
}

function EditTransitItemForm({
  item,
  onOpenChange,
}: {
  item: TransitWeekItemWithProduct
  onOpenChange: (open: boolean) => void
}) {
  const [quantity, setQuantity] = useState(String(item.quantity))
  const [unitPrice, setUnitPrice] = useState(String(item.unit_price))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const parsedQty = parseInt(quantity, 10)
  const parsedPrice = parseFloat(unitPrice)
  const isValid =
    !isNaN(parsedQty) && parsedQty > 0 && !isNaN(parsedPrice) && parsedPrice >= 0
  const hasChanges =
    parsedQty !== item.quantity || parsedPrice !== Number(item.unit_price)

  async function handleSubmit() {
    if (!isValid || !hasChanges) return
    setIsSubmitting(true)

    const result = await updateTransitWeekItem({
      id: item.id,
      quantity: parsedQty,
      unit_price: parsedPrice,
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al actualizar"
      toast.error(msg)
      return
    }

    toast.success("Producto actualizado")
    queryClient.invalidateQueries({ queryKey: ["transit-week"] })
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["transit-month-summary"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    onOpenChange(false)
  }

  const productName = item.product_variants.products.name

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Editar producto</DialogTitle>
        <DialogDescription>{productName}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="edit-qty">Cantidad</Label>
            <Input
              id="edit-qty"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="tabular-nums"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-price">Precio unitario</Label>
            <Input
              id="edit-price"
              type="number"
              min={0}
              step={0.01}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="tabular-nums"
            />
          </div>
        </div>

        {isValid && (
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
            <span className="text-sm">Total</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(parsedQty * parsedPrice)}
            </span>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          disabled={!isValid || !hasChanges || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          Guardar cambios
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
