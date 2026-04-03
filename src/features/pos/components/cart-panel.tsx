"use client"

import { useState } from "react"
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  AlertTriangle,
  FileText,
  Loader2,
  User,
  ArrowRight,
  Tag,
} from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

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
  const hasDiscount = itemsDiscount > 0 || globalDiscount > 0

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

  // ── Empty state ──
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-neutral-50 ring-1 ring-neutral-100">
          <ShoppingBag className="size-8 text-neutral-300" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-400">
            Carrito vacio
          </p>
          <p className="text-xs text-neutral-400/70 mt-1 max-w-[180px] leading-relaxed">
            Agrega productos desde el catalogo para comenzar una venta
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col pt-1 pb-5 px-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-900">
            <ShoppingBag className="size-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight">
              Carrito
            </h2>
            <p className="text-[11px] font-medium text-neutral-400 -mt-0.5">
              {itemCount} {itemCount === 1 ? "articulo" : "articulos"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setConfirmClear(true)}
          className="text-[11px] font-semibold text-neutral-400 hover:text-rose-500 transition-colors"
        >
          Vaciar
        </button>
      </div>

      {/* ── Customer card ── */}
      {customer && (
        <div className="flex items-center gap-2.5 rounded-xl bg-teal-50/60 border border-teal-100 px-3 py-2.5 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10">
            <User className="size-3.5 text-teal-600" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-teal-800 truncate">
              {customer.name}
            </p>
          </div>
          {customer.discountPercent > 0 && (
            <Badge className="text-[9px] bg-teal-500/10 text-teal-700 border-teal-200 hover:bg-teal-500/10">
              -{customer.discountPercent}%
            </Badge>
          )}
        </div>
      )}

      {/* ── Items list (scrollable) ── */}
      <div className="flex-1 -mx-4 overflow-y-auto min-h-0">
        <div className="px-4 space-y-1">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.variantId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
              >
                <CartItemRow item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Summary & Actions (pinned bottom) ── */}
      <div className="mt-3 flex flex-col gap-3">
        {/* Summary card */}
        <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-3.5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">Subtotal</span>
            <span className="text-xs font-medium text-neutral-600 tabular-nums">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {hasDiscount && (
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-xs text-rose-500">
                <Tag className="size-3" />
                Descuento
              </span>
              <span className="text-xs font-medium text-rose-500 tabular-nums">
                -{formatCurrency(itemsDiscount + globalDiscount)}
              </span>
            </div>
          )}

          <div className="border-t border-neutral-200/60 pt-2 flex justify-between items-baseline">
            <span className="text-sm font-semibold text-neutral-700">
              Total
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <motion.button
          onClick={onCheckout}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-900 text-sm font-bold text-white shadow-lg shadow-neutral-900/10 transition-colors hover:bg-neutral-800"
        >
          Cobrar {formatCurrency(total)}
          <ArrowRight className="size-4" />
        </motion.button>

        <button
          onClick={handleSaveQuote}
          disabled={isSavingQuote}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-neutral-400 transition-colors hover:text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
        >
          {isSavingQuote ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileText className="size-3.5" />
          )}
          Guardar como cotizacion
        </button>
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
  const hasCustomerDiscount =
    item.basePrice > 0 && item.unitPrice < item.basePrice
  const discountPercent = hasCustomerDiscount
    ? Math.round((1 - item.unitPrice / item.basePrice) * 100)
    : 0

  return (
    <div className="group relative flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-neutral-50/80">
      {/* Product initials avatar */}
      <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wide">
        {item.productName.slice(0, 2)}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-neutral-800 truncate leading-tight">
              {item.productName}
            </p>
            {item.variantLabel !== item.productName && (
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {item.variantLabel}
              </p>
            )}
          </div>
          <span className="text-[13px] font-bold text-neutral-900 tabular-nums shrink-0">
            {formatCurrency(lineTotal)}
          </span>
        </div>

        {/* Price details */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {hasCustomerDiscount ? (
            <>
              <span className="text-[10px] text-neutral-400 line-through tabular-nums">
                {formatCurrency(item.basePrice)}
              </span>
              <span className="text-[10px] font-semibold text-teal-600 tabular-nums">
                {formatCurrency(item.unitPrice)}
              </span>
              <Badge className="text-[8px] h-4 px-1 bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">
                -{discountPercent}%
              </Badge>
            </>
          ) : (
            <span className="text-[10px] text-neutral-400 tabular-nums">
              {formatCurrency(item.unitPrice)} c/u
            </span>
          )}
          {item.discount > 0 && (
            <span className="text-[10px] font-medium text-rose-500 tabular-nums">
              -{formatCurrency(item.discount)}
            </span>
          )}
        </div>

        {/* Quantity controls + warnings */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="flex size-6 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-8 text-center text-[12px] font-bold tabular-nums text-neutral-700">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="flex size-6 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 disabled:opacity-30"
            >
              <Plus className="size-3" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isLowStock && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                <AlertTriangle className="size-2.5" />
                Stock: {item.stock}
              </span>
            )}
            <button
              onClick={() => removeItem(item.variantId)}
              className="flex size-6 items-center justify-center rounded-lg text-neutral-300 transition-all hover:bg-rose-50 hover:text-rose-500 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
