"use client"

import { useState, useEffect, useMemo } from "react"
import {
  RotateCcw,
  Loader2,
  PackageCheck,
  Minus,
  Plus,
  RefreshCw,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"

import { useSaleDetail } from "../queries"
import { createReturn } from "../actions"

interface ReturnDialogProps {
  saleId: string | null
  onOpenChange: (open: boolean) => void
  onReturned: () => void
}

interface ReturnItemState {
  sale_item_id: string
  product_variant_id: string
  product_name: string
  variant_label: string
  unit_price: number
  max_returnable: number
  quantity: number
  restock: boolean
  replacement_variant_id: string | null
  replacement_product_name: string | null
  replacement_variant_label: string | null
}

export function ReturnDialog({
  saleId,
  onOpenChange,
  onReturned,
}: ReturnDialogProps) {
  const queryClient = useQueryClient()
  const { data: sale, isLoading, isError } = useSaleDetail(saleId)

  const [items, setItems] = useState<ReturnItemState[]>([])
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Compute returnable quantities from sale data
  const returnableItems = useMemo(() => {
    if (!sale) return []

    return sale.sale_items.map((si) => {
      // Sum already returned quantities for this sale_item
      const alreadyReturned = (sale.returns ?? [])
        .filter((ret) => ret.status === "completed")
        .reduce((sum, ret) => {
          return (
            sum +
            (ret.return_items ?? [])
              .filter((ri) => ri.sale_item_id === si.id)
              .reduce((s, ri) => s + ri.quantity, 0)
          )
        }, 0)

      return {
        sale_item_id: si.id,
        product_variant_id: si.product_variant_id,
        product_name: si.product_name,
        variant_label: si.variant_label,
        unit_price: Number(si.unit_price),
        max_returnable: Math.max(0, si.quantity - alreadyReturned),
        quantity: 0,
        restock: true,
        // Default replacement: same product
        replacement_variant_id: si.product_variant_id,
        replacement_product_name: si.product_name,
        replacement_variant_label: si.variant_label,
      }
    })
  }, [sale])

  // Reset items when dialog opens (saleId changes from null to a value)
  // or when sale data changes (e.g., after a return was processed)
  useEffect(() => {
    setItems(returnableItems)
    setReason("")
    setIsSubmitting(false)
  }, [saleId, returnableItems])

  const selectedItems = items.filter((i) => i.quantity > 0)
  const totalRefund = selectedItems.reduce(
    (sum, i) => sum + i.unit_price * i.quantity,
    0
  )
  const isValid = selectedItems.length > 0

  function updateQuantity(index: number, delta: number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const newQty = Math.max(0, Math.min(item.max_returnable, item.quantity + delta))
        return { ...item, quantity: newQty }
      })
    )
  }

  function toggleRestock(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, restock: !item.restock } : item
      )
    )
  }

  async function handleConfirm() {
    if (!saleId || isSubmitting || !isValid) return
    setIsSubmitting(true)

    const result = await createReturn({
      sale_id: saleId,
      reason: reason.trim() || null,
      items: selectedItems.map((i) => ({
        sale_item_id: i.sale_item_id,
        product_variant_id: i.product_variant_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        restock: i.restock,
        replacement_variant_id: i.replacement_variant_id,
        replacement_product_name: i.replacement_product_name,
        replacement_variant_label: i.replacement_variant_label,
      })),
    })

    setIsSubmitting(false)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al procesar la devolucion"
      toast.error(msg)
      return
    }

    toast.success(`Devolucion ${result.data.return_number} creada`)

    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["pos-products"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })

    onOpenChange(false)
    onReturned()
  }

  return (
    <Dialog open={!!saleId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-4" />
            Devolucion
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-neutral-400" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-sm text-neutral-500">
            Error al cargar la venta. Intenta de nuevo.
          </div>
        ) : sale ? (
          <>
            {/* Sale header */}
            <div className="flex justify-between items-start py-3 border-b border-neutral-100">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  {sale.sale_number}
                </p>
                {sale.customers && (
                  <p className="text-sm font-medium text-neutral-700 mt-0.5">
                    {sale.customers.name}
                  </p>
                )}
              </div>
              <p className="text-lg font-bold text-neutral-950 tabular-nums">
                {formatCurrency(Number(sale.total))}
              </p>
            </div>

            {/* Items to return */}
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500 uppercase tracking-wider">
                Selecciona productos a devolver
              </Label>

              {items.map((item, index) => {
                const isFullyReturned = item.max_returnable === 0
                const isSelected = item.quantity > 0

                return (
                  <div
                    key={item.sale_item_id}
                    className={`rounded-lg border p-3 transition-colors ${
                      isFullyReturned
                        ? "opacity-50 bg-neutral-50"
                        : isSelected
                          ? "border-rose-200 bg-rose-50/50"
                          : "border-neutral-200"
                    }`}
                  >
                    {/* Product info + quantity controls */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {item.product_name}
                        </p>
                        {item.variant_label !== item.product_name && (
                          <p className="text-xs text-neutral-500 truncate">
                            {item.variant_label}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {formatCurrency(item.unit_price)} c/u
                        </p>
                      </div>

                      {isFullyReturned ? (
                        <span className="text-xs bg-neutral-200 text-neutral-600 rounded-full px-2 py-0.5 shrink-0">
                          Ya devuelto
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="icon-xs"
                            onClick={() => updateQuantity(index, -1)}
                            disabled={item.quantity === 0}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon-xs"
                            onClick={() => updateQuantity(index, 1)}
                            disabled={item.quantity >= item.max_returnable}
                          >
                            <Plus className="size-3" />
                          </Button>
                          <span className="text-xs text-neutral-400 ml-1">
                            / {item.max_returnable}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Restock toggle (only when selected) */}
                    {isSelected && (
                      <div className="mt-2.5 pt-2.5 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                            <PackageCheck className="size-3.5" />
                            Producto vendible
                          </div>
                          <Switch
                            checked={item.restock}
                            onCheckedChange={() => toggleRestock(index)}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-neutral-400">
                          {item.restock
                            ? `El producto devuelto se regresara al stock (+${item.quantity} uds.)`
                            : "El producto esta dañado o no se puede revender"}
                        </p>
                      </div>
                    )}

                    {/* Replacement product (only when selected) */}
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                            <RefreshCw className="size-3.5" />
                            Cambio para el cliente
                          </div>
                          {item.replacement_variant_id ? (
                            <button
                              type="button"
                              onClick={() =>
                                setItems((prev) =>
                                  prev.map((it, i) =>
                                    i === index
                                      ? {
                                          ...it,
                                          replacement_variant_id: null,
                                          replacement_product_name: null,
                                          replacement_variant_label: null,
                                        }
                                      : it
                                  )
                                )
                              }
                              className="text-xs text-neutral-400 hover:text-neutral-600"
                            >
                              Sin cambio
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setItems((prev) =>
                                  prev.map((it, i) =>
                                    i === index
                                      ? {
                                          ...it,
                                          replacement_variant_id: it.product_variant_id,
                                          replacement_product_name: it.product_name,
                                          replacement_variant_label: it.variant_label,
                                        }
                                      : it
                                  )
                                )
                              }
                              className="text-xs text-teal-500 hover:text-teal-700"
                            >
                              Dar cambio
                            </button>
                          )}
                        </div>
                        {item.replacement_variant_id ? (
                          <div className="mt-1.5 flex items-center gap-2 rounded-md bg-teal-50 px-2.5 py-1.5">
                            <RefreshCw className="size-3 text-teal-500" />
                            <span className="text-xs font-medium text-teal-700 truncate">
                              {item.replacement_product_name}
                              {item.replacement_variant_label !== item.replacement_product_name && (
                                <span className="text-teal-500"> — {item.replacement_variant_label}</span>
                              )}
                            </span>
                          </div>
                        ) : null}
                        <p className="mt-1 text-[11px] text-neutral-400">
                          {item.replacement_variant_id
                            ? `Se entregara ${item.replacement_product_name} al cliente (-${item.quantity} uds. del stock)`
                            : "El cliente no recibira otro producto"}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Reason */}
            <div>
              <Label className="text-xs text-neutral-500">
                Motivo (opcional)
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Producto en mal estado, error en pedido..."
                className="mt-1 resize-none"
                rows={2}
                maxLength={500}
              />
            </div>

            {/* Summary */}
            {selectedItems.length > 0 && (
              <div className="border-t border-neutral-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    {selectedItems.length} producto
                    {selectedItems.length > 1 ? "s" : ""} (
                    {selectedItems.reduce((s, i) => s + i.quantity, 0)} uds.)
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total devolucion</span>
                  <span className="text-rose-600 tabular-nums">
                    {formatCurrency(totalRefund)}
                  </span>
                </div>

                {/* Stock movement breakdown */}
                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-2.5 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Movimiento de stock
                  </p>
                  {selectedItems.map((item) => {
                    const restockQty = item.restock ? item.quantity : 0
                    const replaceQty = item.replacement_variant_id ? item.quantity : 0
                    const net = restockQty - replaceQty
                    return (
                      <div key={item.sale_item_id} className="space-y-0.5">
                        {item.restock && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-600">
                              +{item.quantity} {item.product_name} (devolucion)
                            </span>
                          </div>
                        )}
                        {item.replacement_variant_id && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-rose-500">
                              -{item.quantity} {item.replacement_product_name} (cambio)
                            </span>
                          </div>
                        )}
                        {!item.restock && !item.replacement_variant_id && (
                          <div className="text-[11px] text-neutral-400">
                            Sin movimiento (producto desechado, sin cambio)
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div className="border-t border-neutral-200 pt-1 mt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-neutral-600">Efecto neto</span>
                      <span className={
                        (() => {
                          const totalNet = selectedItems.reduce((sum, i) => {
                            const r = i.restock ? i.quantity : 0
                            const p = i.replacement_variant_id ? i.quantity : 0
                            return sum + r - p
                          }, 0)
                          return totalNet > 0 ? "text-emerald-600" : totalNet < 0 ? "text-rose-500" : "text-neutral-500"
                        })()
                      }>
                        {(() => {
                          const totalNet = selectedItems.reduce((sum, i) => {
                            const r = i.restock ? i.quantity : 0
                            const p = i.replacement_variant_id ? i.quantity : 0
                            return sum + r - p
                          }, 0)
                          return totalNet === 0 ? "0 uds. (cambio directo)" : `${totalNet > 0 ? "+" : ""}${totalNet} uds.`
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm */}
            <Button
              onClick={handleConfirm}
              disabled={!isValid || isSubmitting || isLoading}
              size="lg"
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-1.5 size-4" />
              )}
              Confirmar devolucion
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
