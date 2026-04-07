"use client"

import { useCallback, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  User,
  Tag,
  Percent,
  X,
  Package,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { usePOSStore } from "../store"
import { resolvePrice } from "../utils"
import { usePriceLists } from "@/features/clientes/queries"
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
  const globalDiscount = usePOSStore((s) => s.globalDiscount)
  const setGlobalDiscount = usePOSStore((s) => s.setGlobalDiscount)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemCount = usePOSStore((s) => s.getItemCount)

  // Out-of-stock confirmation dialog state
  const [pendingOosProduct, setPendingOosProduct] = useState<POSProductWithImage | null>(null)

  const doAddProduct = useCallback(
    async (product: POSProductWithImage) => {
      const activeVariants = product.product_variants.filter(
        (v) => v.is_active
      )
      if (activeVariants.length === 0) return

      const variant = activeVariants[0]
      const existingItem = items.find((i) => i.variantId === variant.id)
      const availableStock = Math.max(0, variant.stock - variant.reserved_stock)

      // For in-stock products, cap quantity at available stock
      // For out-of-stock products (vale candidates), allow unlimited quantity
      if (availableStock > 0 && existingItem && existingItem.quantity >= availableStock) return

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

  const handleAddProduct = useCallback(
    async (product: POSProductWithImage) => {
      const activeVariants = product.product_variants.filter((v) => v.is_active)
      if (activeVariants.length === 0) return

      const variant = activeVariants[0]
      const availableStock = Math.max(0, variant.stock - variant.reserved_stock)
      const existingItem = items.find((i) => i.variantId === variant.id)

      // First time adding an out-of-stock product → show confirmation dialog
      if (availableStock === 0 && !existingItem) {
        setPendingOosProduct(product)
        return
      }

      await doAddProduct(product)
    },
    [doAddProduct, items]
  )

  const { data: priceLists = [] } = usePriceLists()
  const activeDiscounts = priceLists.filter((pl) => Number(pl.discount_percent) > 0)

  const [discountOpen, setDiscountOpen] = useState(false)
  const [customInputOpen, setCustomInputOpen] = useState(false)
  const [discountMode, setDiscountMode] = useState<"percent" | "fixed">("percent")
  const [discountInput, setDiscountInput] = useState("")

  const hasItems = items.length > 0

  return (
    <>
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
                  {customer && customer.discountPercent > 0 && items.length > 0 && (() => {
                    const totalSavings = items.reduce(
                      (sum, i) => sum + (i.basePrice - i.unitPrice) * i.quantity,
                      0
                    )
                    return totalSavings > 0 ? (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-teal-500/10 border border-teal-200/60 px-3 py-2">
                        <Tag className="h-3 w-3 flex-shrink-0 text-teal-600" />
                        <span className="text-[11px] font-semibold text-teal-700">
                          Ahorrando {formatCurrency(totalSavings)} con {customer.discountPercent}% desc.
                        </span>
                      </div>
                    ) : null
                  })()}
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
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                              {item.basePrice > item.unitPrice ? (
                                <>
                                  <span className="text-neutral-400 line-through tabular-nums">
                                    {formatCurrency(item.basePrice)}
                                  </span>
                                  <span className="font-semibold text-teal-600 tabular-nums">
                                    {formatCurrency(item.unitPrice)} c/u
                                  </span>
                                </>
                              ) : (
                                <span className="text-neutral-400 tabular-nums">
                                  {formatCurrency(item.unitPrice)} c/u
                                </span>
                              )}
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
                              disabled={item.stock > 0 && item.quantity >= item.stock}
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
                  {(() => {
                    const basePriceTotal = items.reduce(
                      (sum, i) => sum + i.basePrice * i.quantity,
                      0
                    )
                    const customerSavings = items.reduce(
                      (sum, i) => sum + (i.basePrice - i.unitPrice) * i.quantity,
                      0
                    )
                    const hasCustomerDiscount = customerSavings > 0
                    const itemsDiscount = getItemsDiscount()

                    return (
                      <div className="space-y-1.5">
                        {hasCustomerDiscount ? (
                          <>
                            <div className="flex justify-between text-xs text-neutral-500">
                              <span>Precio base</span>
                              <span className="font-medium tabular-nums">
                                {formatCurrency(basePriceTotal)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 font-semibold text-teal-600">
                                <Tag className="h-3 w-3" />
                                Desc. -{customer?.discountPercent}%
                              </span>
                              <span className="font-semibold tabular-nums text-teal-600">
                                -{formatCurrency(customerSavings)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-xs text-neutral-500">
                            <span>Subtotal</span>
                            <span className="font-medium tabular-nums">
                              {formatCurrency(getSubtotal())}
                            </span>
                          </div>
                        )}
                        {itemsDiscount > 0 && (
                          <div className="flex justify-between text-xs text-rose-500">
                            <span>Descuento adicional</span>
                            <span className="font-medium tabular-nums">
                              -{formatCurrency(itemsDiscount)}
                            </span>
                          </div>
                        )}

                        {/* Global discount display */}
                        {globalDiscount > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-1 font-semibold text-rose-500">
                              <Percent className="h-3 w-3" />
                              Descuento
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold tabular-nums text-rose-500">
                                -{formatCurrency(globalDiscount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setGlobalDiscount(0)
                                  setDiscountInput("")
                                  setDiscountOpen(false)
                                }}
                                className="flex size-4 items-center justify-center rounded text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Add discount button */}
                        {globalDiscount === 0 && !discountOpen && (
                          <button
                            type="button"
                            onClick={() => { setDiscountOpen(true); setCustomInputOpen(false) }}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-rose-200 bg-rose-50/40 py-2 text-xs font-semibold text-rose-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Tag className="size-3.5" />
                            Agregar descuento
                          </button>
                        )}

                        {/* Discount picker */}
                        {discountOpen && globalDiscount === 0 && (
                          <div className="rounded-lg border border-rose-100 bg-rose-50/40 p-2 space-y-1.5">
                            {/* Predefined discounts */}
                            {!customInputOpen && (
                              <>
                                {activeDiscounts.map((pl) => (
                                  <button
                                    key={pl.id}
                                    type="button"
                                    onClick={() => {
                                      const pct = Number(pl.discount_percent)
                                      const amount = Math.round(getSubtotal() * (pct / 100) * 100) / 100
                                      setGlobalDiscount(amount)
                                      setDiscountOpen(false)
                                    }}
                                    className="flex w-full items-center justify-between rounded-md bg-white border border-neutral-200/80 px-3 py-2 text-xs transition-colors hover:border-rose-200 hover:bg-rose-50/50"
                                  >
                                    <span className="font-medium text-neutral-700">{pl.name}</span>
                                    <span className="font-bold text-rose-500 tabular-nums">-{Number(pl.discount_percent)}%</span>
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setCustomInputOpen(true)}
                                  className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-200 py-1.5 text-[10px] font-semibold text-neutral-400 transition-colors hover:border-rose-200 hover:text-rose-500"
                                >
                                  <Percent className="size-3" />
                                  Personalizado
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setDiscountOpen(false); setDiscountInput("") }}
                                  className="flex w-full items-center justify-center py-1 text-[10px] font-semibold text-neutral-400 hover:text-neutral-600 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}

                            {/* Custom input */}
                            {customInputOpen && (
                              <>
                                <div className="flex items-center gap-1 rounded-lg bg-white border border-neutral-200/80 p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => { setDiscountMode("percent"); setDiscountInput("") }}
                                    className={cn(
                                      "flex-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all",
                                      discountMode === "percent"
                                        ? "bg-rose-500 text-white shadow-sm"
                                        : "text-neutral-500 hover:text-rose-600"
                                    )}
                                  >
                                    %
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setDiscountMode("fixed"); setDiscountInput("") }}
                                    className={cn(
                                      "flex-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all",
                                      discountMode === "fixed"
                                        ? "bg-rose-500 text-white shadow-sm"
                                        : "text-neutral-500 hover:text-rose-600"
                                    )}
                                  >
                                    $
                                  </button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={discountMode === "percent" ? 100 : getSubtotal()}
                                    step="any"
                                    placeholder={discountMode === "percent" ? "Ej: 10" : "Ej: 50"}
                                    value={discountInput}
                                    onChange={(e) => setDiscountInput(e.target.value)}
                                    className="h-7 flex-1 rounded-md border border-neutral-200/80 bg-white px-2 text-xs tabular-nums outline-none focus:border-rose-200 focus:ring-2 focus:ring-rose-500/10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const val = parseFloat(discountInput)
                                      if (isNaN(val) || val <= 0) return
                                      const sub = getSubtotal()
                                      const amount = discountMode === "percent"
                                        ? Math.round(sub * (val / 100) * 100) / 100
                                        : Math.min(val, sub)
                                      setGlobalDiscount(amount)
                                      setDiscountOpen(false)
                                      setCustomInputOpen(false)
                                    }}
                                    className="flex h-7 items-center justify-center rounded-md bg-rose-500 px-2.5 text-[10px] font-semibold text-white hover:bg-rose-600 transition-colors"
                                  >
                                    Aplicar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setCustomInputOpen(false); setDiscountInput("") }}
                                    className="flex size-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 transition-colors"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-extrabold">
                          <span className="text-neutral-800">Total</span>
                          <span className="tabular-nums text-rose-600">
                            {formatCurrency(getTotal())}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
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
          className="flex h-12 items-center gap-2 rounded-xl bg-accent-500 px-6 text-base font-bold text-white shadow-sm shadow-accent-500/20 transition-colors hover:bg-accent-600 disabled:opacity-40 disabled:shadow-none disabled:hover:bg-accent-500"
        >
          Continuar <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>

      {/* Out-of-stock confirmation dialog */}
      {pendingOosProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <Package className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                Producto sin stock
              </h3>
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              <span className="font-semibold text-neutral-700">&quot;{pendingOosProduct.name}&quot;</span>{" "}
              no tiene stock disponible. Solo se podra vender como vale — el
              cliente recibira el producto cuando se reabastezca.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingOosProduct(null)}
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await doAddProduct(pendingOosProduct)
                  setPendingOosProduct(null)
                }}
                className="flex h-10 flex-1 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white transition-colors hover:bg-indigo-600 active:scale-[0.98]"
              >
                Entendido, agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
