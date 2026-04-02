"use client"

import { useCallback } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  User,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { usePOSStore } from "../store"
import { resolvePrice } from "../utils"
import { POSProductGrid } from "./pos-product-grid"
import type { POSProductWithImage } from "../queries"

// Thin, minimal scrollbar applied to every overflow area
const THIN_SCROLL =
  "[scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.08)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300/40"

interface WizardProductsStepProps {
  onNext: () => void
  onBack: () => void
}

export function WizardProductsStep({
  onNext,
  onBack,
}: WizardProductsStepProps) {
  const items = usePOSStore((s) => s.items)
  const addItem = usePOSStore((s) => s.addItem)
  const removeItem = usePOSStore((s) => s.removeItem)
  const updateQuantity = usePOSStore((s) => s.updateQuantity)
  const customer = usePOSStore((s) => s.customer)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemCount = usePOSStore((s) => s.getItemCount)

  const handleAddProduct = useCallback(
    async (product: POSProductWithImage) => {
      const availableVariants = product.product_variants.filter(
        (v) => v.is_active && v.stock - v.reserved_stock > 0
      )
      if (availableVariants.length === 0) return

      const variant = availableVariants[0]
      const existingItem = items.find((i) => i.variantId === variant.id)
      const availableStock = variant.stock - variant.reserved_stock
      if (existingItem && existingItem.quantity >= availableStock) return

      let price = variant.price
      if (customer) {
        try {
          price = await resolvePrice(
            variant.id,
            variant.price,
            customer.priceListId,
            customer.discountPercent
          )
        } catch {
          // Use base price if resolution fails
        }
      }

      addItem({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantLabel: variant.name ?? product.name,
        sku: variant.sku,
        basePrice: variant.price,
        unitPrice: price,
        unitCost: variant.cost,
        stock: availableStock,
      })
    },
    [addItem, customer, items]
  )

  const hasItems = items.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* ── Main area: product grid + cart panel ── */}
      <div className="flex min-h-0 flex-1">
        {/* Left: product grid */}
        <div
          className={cn(
            "flex min-w-0 flex-col transition-all duration-200",
            hasItems ? "flex-1" : "w-full"
          )}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-white px-6 pt-8 pb-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Agregar productos
            </h2>
            <p className="mt-1.5 text-base text-neutral-500">
              Busca y agrega productos al carrito
            </p>
          </div>

          {/* Grid (scrollable — darker recessed bg) */}
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto bg-neutral-100/60 px-6 py-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.04)] sm:px-8",
              THIN_SCROLL
            )}
          >
            <POSProductGrid onAdd={handleAddProduct} />
          </div>
        </div>

        {/* Right: cart side panel */}
        <AnimatePresence>
          {hasItems && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-shrink-0 flex-col overflow-hidden border-l border-neutral-200/60 bg-white shadow-[inset_1px_0_4px_rgba(0,0,0,0.03)]"
            >
              <div className="flex h-full w-[340px] flex-col">
                {/* Panel header */}
                <div className="flex-shrink-0 px-5 pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[1.5px] text-neutral-400">
                      Carrito
                    </h3>
                    <span className="flex h-5 min-w-[22px] items-center justify-center rounded-full bg-rose-100 px-1.5 text-[11px] font-bold tabular-nums text-rose-600">
                      {getItemCount()}
                    </span>
                  </div>
                  {customer && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-teal-50/80 px-3 py-2">
                      <User className="h-3.5 w-3.5 text-teal-600" />
                      <span className="truncate text-xs font-semibold text-teal-700">
                        {customer.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="mx-5 h-px bg-neutral-100" />

                {/* Cart items (scrollable — thin scrollbar) */}
                <div
                  className={cn(
                    "min-h-0 flex-1 overflow-y-auto px-5 py-4",
                    THIN_SCROLL
                  )}
                >
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.variantId}
                        className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold leading-tight text-neutral-800">
                              {item.productName}
                            </p>
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
                                updateQuantity(
                                  item.variantId,
                                  item.quantity - 1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 transition-all duration-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 hover:shadow-sm active:scale-90 active:bg-rose-100"
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
                                updateQuantity(
                                  item.variantId,
                                  item.quantity + 1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 transition-all duration-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 hover:shadow-sm active:scale-90 active:bg-rose-100 disabled:pointer-events-none disabled:opacity-30"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-bold tabular-nums text-neutral-800">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel totals */}
                <div className="flex-shrink-0 border-t border-neutral-100 bg-neutral-50/40 px-5 py-5">
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
                    <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-extrabold">
                      <span className="text-neutral-800">Total</span>
                      <span className="tabular-nums text-rose-600">
                        {formatCurrency(getTotal())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex flex-shrink-0 items-center gap-3 border-t border-neutral-200/60 bg-white px-6 py-4 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" /> Atras
        </button>

        {hasItems && (
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-2.5">
            <ShoppingBag className="h-4 w-4 flex-shrink-0 text-neutral-400" />
            <span className="truncate text-sm text-neutral-600">
              <span className="font-bold text-neutral-800">
                {getItemCount()}
              </span>{" "}
              productos
            </span>
            <span className="ml-auto flex-shrink-0 text-base font-extrabold tabular-nums text-rose-600">
              {formatCurrency(getTotal())}
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={!hasItems}
          onClick={onNext}
          className="flex h-12 items-center gap-2 rounded-xl bg-rose-500 px-6 text-base font-bold text-white shadow-sm shadow-rose-500/20 transition-colors hover:bg-rose-600 disabled:opacity-40 disabled:shadow-none disabled:hover:bg-rose-500"
        >
          Continuar <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
