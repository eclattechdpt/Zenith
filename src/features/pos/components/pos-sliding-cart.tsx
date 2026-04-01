"use client"

import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { usePOSStore } from "../store"

interface POSSlidingCartProps {
  onCheckout: () => void
}

export function POSSlidingCart({ onCheckout }: POSSlidingCartProps) {
  const items = usePOSStore((s) => s.items)
  const updateQuantity = usePOSStore((s) => s.updateQuantity)
  const removeItem = usePOSStore((s) => s.removeItem)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemCount = usePOSStore((s) => s.getItemCount)
  const clear = usePOSStore((s) => s.clear)

  if (items.length === 0) return null

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 overflow-hidden"
    >
      <div className="flex h-full w-[320px] flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-lg">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-stone-800">
            <ShoppingCart className="h-4 w-4" />
            Carrito
          </h2>
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
            {getItemCount()} items
          </span>
        </div>

        {/* Items */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.variantId}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 rounded-lg bg-stone-50 p-2"
              >
                {/* Initials thumbnail */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-rose-100 to-rose-200 text-xs font-bold text-rose-300">
                  {item.productName.slice(0, 2).toUpperCase()}
                </div>

                {/* Name + price */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-stone-800">{item.productName}</p>
                  <p className="text-[10px] text-stone-500">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      item.quantity <= 1
                        ? removeItem(item.variantId)
                        : updateQuantity(item.variantId, item.quantity - 1)
                    }
                    className="flex h-5 w-5 items-center justify-center rounded bg-stone-200 text-stone-600 hover:bg-stone-300"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => {
                      if (item.quantity < item.stock) updateQuantity(item.variantId, item.quantity + 1)
                    }}
                    disabled={item.quantity >= item.stock}
                    className="flex h-5 w-5 items-center justify-center rounded bg-stone-200 text-stone-600 hover:bg-stone-300 disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Line total */}
                <p className="w-14 text-right text-xs font-bold text-stone-800">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-stone-400 hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-3 border-t border-stone-100 pt-3">
          <div className="mb-1 flex justify-between text-xs text-stone-500">
            <span>Subtotal</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>
          <div className="mb-3 flex justify-between text-sm font-extrabold">
            <span className="text-stone-800">Total</span>
            <span className="text-rose-600">{formatCurrency(getTotal())}</span>
          </div>
          <Button
            onClick={onCheckout}
            className="mb-2 h-10 w-full bg-rose-600 text-sm font-bold text-white hover:bg-rose-700"
          >
            Confirmar venta →
          </Button>
          <Button
            variant="outline"
            onClick={clear}
            className="h-8 w-full text-xs text-stone-500"
          >
            Vaciar carrito
          </Button>
        </div>
      </div>
    </motion.aside>
  )
}

export function POSCartFAB({ onClick }: { onClick: () => void }) {
  const getItemCount = usePOSStore((s) => s.getItemCount)
  const getTotal = usePOSStore((s) => s.getTotal)

  const itemCount = getItemCount()
  const total = getTotal()

  if (itemCount === 0) return null

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-white shadow-lg shadow-rose-600/30 sm:hidden"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-bold">{formatCurrency(total)}</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-900">
        {itemCount}
      </span>
    </motion.button>
  )
}
