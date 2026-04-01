"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus, CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useReactToPrint } from "react-to-print"

import { Button } from "@/components/ui/button"
import { useRealtimeSync } from "@/hooks/use-realtime"

import { usePOSStore } from "../store"
import { resolvePrice } from "../utils"
import {
  useTopSellingProducts,
  useRecentlySoldProducts,
} from "../queries"
import type { POSProductWithImage } from "../queries"
import type { PendingSaleWithSummary } from "../types"
import type { ReceiptData } from "./sale-receipt"

import { POSKpiWidgets } from "./pos-kpi-widgets"
import { POSPendingSales } from "./pos-pending-sales"
import { POSProductCarousel } from "./pos-product-carousel"
import { POSProductGrid } from "./pos-product-grid"
import { POSSlidingCart, POSCartFAB } from "./pos-sliding-cart"
import { POSSaleWizard } from "./pos-sale-wizard"
import { SaleReceipt } from "./sale-receipt"

// ── Types ──

type WizardMode = "from-cart" | "new-sale" | "complete-pending"

// ── Realtime query keys (stable references) ──

const VARIANT_KEYS = [
  ["pos-products"],
  ["pos-all-products"],
  ["pos-top-selling"],
  ["pos-recently-sold"],
]

const SALES_KEYS = [
  ["pos-dashboard-stats"],
  ["pos-pending-sales"],
  ["sales"],
]

// ── Component ──

export function POSLanding() {
  // ── Wizard state ──
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<WizardMode>("new-sale")
  const [pendingSale, setPendingSale] = useState<PendingSaleWithSummary | null>(
    null
  )

  // ── Receipt printing ──
  const receiptRef = useRef<HTMLDivElement>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receiptData ? `Recibo-${receiptData.saleNumber}` : "Recibo",
  })

  // ── Store ──
  const items = usePOSStore((s) => s.items)
  const addItem = usePOSStore((s) => s.addItem)
  const customer = usePOSStore((s) => s.customer)

  // ── Queries ──
  const { data: topProducts } = useTopSellingProducts(10)
  const { data: recentProducts } = useRecentlySoldProducts(10)

  // ── Realtime sync ──
  useRealtimeSync("product_variants", VARIANT_KEYS)
  useRealtimeSync("sales", SALES_KEYS)

  // ── Add product to cart (shared by carousels and grid) ──
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
        price = await resolvePrice(
          variant.id,
          variant.price,
          customer.priceListId,
          customer.discountPercent
        )
      }

      addItem({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantLabel: variant.name ?? product.name,
        sku: variant.sku,
        unitPrice: price,
        unitCost: variant.cost,
        stock: availableStock,
      })
    },
    [items, addItem, customer]
  )

  // ── Wizard openers ──
  const openNewSale = useCallback(() => {
    setWizardMode("new-sale")
    setPendingSale(null)
    setWizardOpen(true)
  }, [])

  const openCheckout = useCallback(() => {
    setWizardMode("from-cart")
    setPendingSale(null)
    setWizardOpen(true)
  }, [])

  const openCompletePending = useCallback((sale: PendingSaleWithSummary) => {
    setWizardMode("complete-pending")
    setPendingSale(sale)
    setWizardOpen(true)
  }, [])

  const closeWizard = useCallback(() => {
    setWizardOpen(false)
    setPendingSale(null)
  }, [])

  // ── Print trigger from wizard ──
  const triggerPrint = useCallback(() => {
    // The wizard's confirmation step calls this after sale is complete.
    // We give a small delay so the receipt ref is painted in the DOM.
    setTimeout(() => {
      handlePrint()
    }, 200)
  }, [handlePrint])

  // ── Today's date ──
  const todayLabel = useMemo(
    () =>
      format(new Date(), "EEEE, d 'de' MMMM", { locale: es }).replace(
        /^\w/,
        (c) => c.toUpperCase()
      ),
    []
  )

  return (
    <>
      <div className="flex h-full gap-4">
        {/* ── Main content ── */}
        <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-stone-800 sm:text-2xl">
                Punto de venta
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                <CalendarDays className="h-3.5 w-3.5" />
                {todayLabel}
              </p>
            </div>
            <Button
              onClick={openNewSale}
              className="h-9 gap-1.5 bg-rose-600 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
            >
              <Plus className="h-4 w-4" />
              Nueva venta
            </Button>
          </motion.div>

          {/* KPI widgets */}
          <POSKpiWidgets />

          {/* Pending sales */}
          <POSPendingSales onComplete={openCompletePending} />

          {/* Top-selling carousel */}
          {topProducts && topProducts.length > 0 && (
            <POSProductCarousel
              title="Mas vendidos"
              icon="🔥"
              products={topProducts}
              onAdd={handleAddProduct}
            />
          )}

          {/* Recently sold carousel */}
          {recentProducts && recentProducts.length > 0 && (
            <POSProductCarousel
              title="Vendidos recientemente"
              icon="🕐"
              products={recentProducts}
              onAdd={handleAddProduct}
            />
          )}

          {/* Full product grid */}
          <POSProductGrid onAdd={handleAddProduct} />
        </div>

        {/* ── Sliding cart sidebar (desktop) ── */}
        <AnimatePresence>
          {items.length > 0 && (
            <div className="hidden sm:block">
              <POSSlidingCart onCheckout={openCheckout} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Cart FAB (mobile) ── */}
      <AnimatePresence>
        {items.length > 0 && <POSCartFAB onClick={openCheckout} />}
      </AnimatePresence>

      {/* ── Sale wizard modal ── */}
      <POSSaleWizard
        open={wizardOpen}
        onClose={closeWizard}
        mode={wizardMode}
        pendingSale={pendingSale}
        onPrint={triggerPrint}
      />

      {/* ── Hidden receipt for printing ── */}
      {receiptData && (
        <div className="hidden">
          <SaleReceipt ref={receiptRef} data={receiptData} />
        </div>
      )}
    </>
  )
}
