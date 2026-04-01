"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, ShoppingCart, AlertTriangle, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import { usePOSStore } from "../store"
import { createQuote } from "../actions"
import type { CartItem } from "../types"

export function CartPanel({
  onCheckout,
}: {
  onCheckout: () => void
}) {
  const queryClient = useQueryClient()
  const items = usePOSStore((s) => s.items)
  const customer = usePOSStore((s) => s.customer)
  const globalDiscount = usePOSStore((s) => s.globalDiscount)
  const notes = usePOSStore((s) => s.notes)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemCount = usePOSStore((s) => s.getItemCount)
  const clear = usePOSStore((s) => s.clear)

  const [isSavingQuote, setIsSavingQuote] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const subtotal = getSubtotal()
  const itemsDiscount = getItemsDiscount()
  const total = getTotal()
  const itemCount = getItemCount()

  async function handleSaveQuote() {
    if (isSavingQuote) return
    setIsSavingQuote(true)

    const result = await createQuote({
      customer_id: customer?.id ?? null,
      items: items.map((item) => ({
        product_variant_id: item.variantId,
        product_name: item.productName,
        variant_label: item.variantLabel,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        unit_cost: item.unitCost,
        discount: item.discount,
      })),
      discount_amount: globalDiscount,
      notes: notes || null,
      expires_days: 15,
    })

    setIsSavingQuote(false)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al guardar cotizacion"
      toast.error(msg)
      return
    }

    toast.success(`Cotizacion ${result.data.sale_number} guardada`)
    queryClient.invalidateQueries({ queryKey: ["sales"] })
    clear()
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-neutral-100">
          <ShoppingCart className="size-7 text-neutral-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-500">Carrito vacio</p>
          <p className="text-xs text-neutral-400 mt-1">
            Busca un producto para comenzar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-neutral-950">Carrito</h2>
          <Badge variant="secondary" className="text-[10px]">
            {itemCount} {itemCount === 1 ? "articulo" : "articulos"}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmClear(true)}
          className="text-xs text-neutral-500 hover:text-destructive"
        >
          Vaciar
        </Button>
      </div>

      {/* Customer badge */}
      {customer && (
        <div className="flex items-center gap-2 px-4 py-2 bg-teal-50/50 border-b border-neutral-100">
          <span className="text-xs font-medium text-teal-700">
            {customer.name}
          </span>
          {customer.discountPercent > 0 && (
            <Badge variant="secondary" className="text-[9px]">
              -{customer.discountPercent}%
            </Badge>
          )}
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
        {items.map((item) => (
          <CartItemRow key={item.variantId} item={item} />
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-neutral-200 px-4 pt-3 pb-4 space-y-2">
        <div className="flex justify-between text-sm text-neutral-500">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {(itemsDiscount > 0 || globalDiscount > 0) && (
          <div className="flex justify-between text-sm text-rose-500">
            <span>Descuento</span>
            <span>-{formatCurrency(itemsDiscount + globalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-neutral-950 pt-1 border-t border-neutral-100">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <Button
          onClick={onCheckout}
          className="w-full mt-2"
          size="lg"
          disabled={items.length === 0}
        >
          Cobrar {formatCurrency(total)}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveQuote}
          disabled={items.length === 0 || isSavingQuote}
          className="w-full"
        >
          {isSavingQuote ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <FileText className="mr-1.5 size-3.5" />
          )}
          Guardar cotizacion
        </Button>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Vaciar carrito"
        description="Se eliminaran todos los productos del carrito. Esta accion no se puede deshacer."
        confirmLabel="Vaciar"
        variant="destructive"
        onConfirm={() => {
          clear()
          setConfirmClear(false)
        }}
      />
    </div>
  )
}

function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = usePOSStore((s) => s.updateQuantity)
  const removeItem = usePOSStore((s) => s.removeItem)

  const lineTotal = item.unitPrice * item.quantity - item.discount
  const isLowStock = item.quantity > item.stock

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-950 truncate">
          {item.productName}
        </p>
        {item.variantLabel !== item.productName && (
          <p className="text-xs text-neutral-500 truncate">{item.variantLabel}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-neutral-400">
            {formatCurrency(item.unitPrice)} c/u
          </span>
          {item.discount > 0 && (
            <span className="text-xs text-rose-500">
              -{formatCurrency(item.discount)}
            </span>
          )}
          {isLowStock && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
              <AlertTriangle className="size-3" />
              Stock: {item.stock}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
        >
          <Minus className="size-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
          disabled={item.quantity >= item.stock}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm font-semibold text-neutral-950 tabular-nums">
          {formatCurrency(lineTotal)}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => removeItem(item.variantId)}
          className="text-neutral-400 hover:text-destructive"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  )
}
