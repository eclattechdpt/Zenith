"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus, CalendarDays, Flame, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useReactToPrint } from "react-to-print"

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
        try {
          price = await resolvePrice(
            variant.id,
            variant.price,
            customer.priceListId,
            customer.discountPercent
          )
        } catch {
          // Fall back to base price
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
  const triggerPrint = useCallback(
    (data: ReceiptData) => {
      setReceiptData(data)
      setTimeout(() => {
        handlePrint()
      }, 200)
    },
    [handlePrint]
  )

  // ── Today's date ──
  const todayLabel = useMemo(
    () =>
      format(new Date(), "EEEE, d 'de' MMMM", { locale: es }).replace(
        /^\w/,
        (c) => c.toUpperCase()
      ),
    []
  )

  const hasCarousels =
    (topProducts && topProducts.length > 0) ||
    (recentProducts && recentProducts.length > 0)

  return (
    <>
      <div className="flex h-full gap-4">
        {/* ── Main content ── */}
        <div className="min-w-0 flex-1 space-y-8 overflow-y-auto p-5 sm:p-8">
          {/* ── Hero header ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {todayLabel}
              </p>
              <h1 className="mt-1 font-display text-[38px] font-semibold leading-none tracking-[-1.5px] text-neutral-950 sm:text-[48px]">
                Punto de venta
              </h1>
            </div>

            {/* Hero CTA */}
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={openNewSale}
                className="group h-11 gap-2 rounded-xl bg-rose-500 px-6 text-sm font-bold text-white transition-colors hover:bg-rose-600 sm:h-12 sm:px-7"
              >
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                Nueva venta
              </Button>
            </motion.div>
          </motion.div>

          {/* KPI widgets */}
          <POSKpiWidgets />

          {/* Pending sales */}
          <POSPendingSales onComplete={openCompletePending} />

          {/* ── Carousels card: Mas vendidos + Vendidos recientemente ── */}
          {hasCarousels && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-5 shadow-sm shadow-neutral-900/[0.03] sm:p-7"
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Top selling */}
                {topProducts && topProducts.length > 0 && (
                  <POSProductCarousel
                    title="Mas vendidos"
                    icon={<Flame className="h-4 w-4" />}
                    products={topProducts}
                    onAdd={handleAddProduct}
                  />
                )}

                {/* Recently sold */}
                {recentProducts && recentProducts.length > 0 && (
                  <POSProductCarousel
                    title="Vendidos recientemente"
                    icon={<Clock className="h-4 w-4" />}
                    products={recentProducts}
                    onAdd={handleAddProduct}
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* ── Full product grid (in card) ── */}
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
