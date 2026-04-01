"use client"

import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
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
      animate={{ width: 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 overflow-hidden"
    >
      <div className="flex h-full w-[340px] flex-col rounded-2xl border border-neutral-100 bg-white p-4 shadow-xl shadow-neutral-900/5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-800">Carrito</h2>
              <p className="text-[10px] font-medium text-neutral-400">
                {getItemCount()} productos
              </p>
            </div>
          </div>
          <button
            onClick={clear}
            className="text-[11px] font-semibold text-neutral-400 transition-colors hover:text-rose-500"
          >
            Vaciar
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.variantId}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="group flex items-center gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-neutral-50"
              >
                {/* Initials thumbnail */}
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[10px] font-bold text-neutral-400">
                  {item.productName.slice(0, 2).toUpperCase()}
                </div>

                {/* Name + price */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-neutral-800">
                    {item.productName}
                  </p>
                  <p className="text-[10px] font-medium text-neutral-400">
                    {formatCurrency(item.unitPrice)} x {item.quantity}
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
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-[11px] font-bold tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (item.quantity < item.stock)
                        updateQuantity(item.variantId, item.quantity + 1)
                    }}
                    disabled={item.quantity >= item.stock}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Line total */}
                <p className="w-16 text-right text-[12px] font-bold tabular-nums text-neutral-800">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-neutral-300 opacity-0 transition-all hover:text-rose-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-3 border-t border-neutral-100 pt-4">
          <div className="mb-1 flex justify-between text-[11px] font-medium text-neutral-400">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(getSubtotal())}</span>
          </div>
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-sm font-bold text-neutral-800">Total</span>
            <span className="font-display text-[24px] font-semibold tracking-[-0.5px] text-neutral-900">
              {formatCurrency(getTotal())}
            </span>
          </div>
          <motion.button
            onClick={onCheckout}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-colors hover:bg-rose-600"
          >
            Confirmar venta
            <ArrowRight className="h-4 w-4" />
          </motion.button>
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
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-rose-500 px-5 py-3.5 text-white shadow-xl shadow-rose-500/25 sm:hidden"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-bold">{formatCurrency(total)}</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold">
        {itemCount}
      </span>
    </motion.button>
  )
}
