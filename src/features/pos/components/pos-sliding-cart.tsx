"use client"

import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, User } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn, formatCurrency } from "@/lib/utils"
import { usePOSStore } from "../store"

const THIN_SCROLL =
  "[scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.08)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300/40"

interface POSSlidingCartProps {
  onCheckout: () => void
}

export function POSSlidingCart({ onCheckout }: POSSlidingCartProps) {
  const items = usePOSStore((s) => s.items)
  const updateQuantity = usePOSStore((s) => s.updateQuantity)
  const removeItem = usePOSStore((s) => s.removeItem)
  const customer = usePOSStore((s) => s.customer)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemCount = usePOSStore((s) => s.getItemCount)
  const clear = usePOSStore((s) => s.clear)

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0 }}
      animate={{ width: 380, opacity: 1, paddingLeft: 4, paddingRight: 12 }}
      exit={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 h-full overflow-hidden py-3"
    >
      <div className="flex h-full w-[364px] flex-col rounded-2xl bg-neutral-100 shadow-[inset_2px_3px_10px_rgba(0,0,0,0.07),inset_-1px_-1px_6px_rgba(255,255,255,0.6)]">
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[1.5px] text-neutral-500">
              Carrito
            </h3>
            <div className="flex items-center gap-3">
              <span className="flex h-5 min-w-[22px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold tabular-nums text-white shadow-sm shadow-rose-500/20">
                {getItemCount()}
              </span>
              <button
                onClick={clear}
                className="text-[11px] font-semibold text-neutral-400 transition-colors hover:text-rose-500"
              >
                Vaciar
              </button>
            </div>
          </div>

          {/* Customer badge */}
          {customer && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 border border-teal-100 px-3 py-2 shadow-sm shadow-teal-500/5">
              <User className="h-3.5 w-3.5 text-teal-600" />
              <span className="truncate text-xs font-semibold text-teal-700">
                {customer.name}
              </span>
            </div>
          )}
        </div>

        {/* ── Items (scrollable) ── */}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-4 py-3",
            THIN_SCROLL
          )}
        >
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.variantId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                  className="rounded-xl border border-white/80 bg-white p-3.5 shadow-sm shadow-neutral-900/[0.04]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold leading-tight text-neutral-800">
                        {item.productName}
                      </p>
                      {item.variantLabel !== item.productName && (
                        <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                          {item.variantLabel}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {formatCurrency(item.unitPrice)} c/u
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="flex-shrink-0 rounded-md p-1.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 transition-all duration-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 hover:shadow-sm active:scale-90 active:bg-rose-100"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-bold tabular-nums text-neutral-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.stock}
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 transition-all duration-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 hover:shadow-sm active:scale-90 active:bg-rose-100 disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold tabular-nums text-neutral-800">
                      {formatCurrency(
                        item.unitPrice * item.quantity - item.discount
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Summary + checkout (pushed to bottom) ── */}
        <div className="mt-auto flex-shrink-0 px-4 pb-4 space-y-2.5">
          {/* Summary card */}
          <div className="rounded-xl bg-white border border-white/80 p-4 shadow-sm shadow-neutral-900/[0.04]">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Subtotal</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(getSubtotal())}
                </span>
              </div>
              {getItemsDiscount() > 0 && (
                <div className="flex justify-between text-xs text-teal-600">
                  <span>Descuento</span>
                  <span className="font-medium tabular-nums">
                    -{formatCurrency(getItemsDiscount())}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-extrabold">
                <span className="text-neutral-800">Total</span>
                <span className="tabular-nums text-rose-600">
                  {formatCurrency(getTotal())}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout button */}
          <div>
          <motion.button
            onClick={onCheckout}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-500 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-colors hover:bg-rose-600"
          >
            Confirmar venta
            <ArrowRight className="h-4 w-4" />
          </motion.button>
          </div>
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
      <ShoppingBag className="h-5 w-5" />
      <span className="text-sm font-bold">{formatCurrency(total)}</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
        {itemCount}
      </span>
    </motion.button>
  )
}
