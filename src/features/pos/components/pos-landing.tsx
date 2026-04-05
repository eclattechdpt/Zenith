"use client"

import { useState, useCallback, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Flame, Clock } from "lucide-react"
import { PageHero } from "@/components/shared/page-hero"
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
import { ProductEditDialog } from "@/features/productos/components/product-edit-dialog"

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

  // ── Product edit dialog ──
  const [editProductId, setEditProductId] = useState<string | null>(null)

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

  const hasCarousels =
    (topProducts && topProducts.length > 0) ||
    (recentProducts && recentProducts.length > 0)

  return (
    <>
      <div className="flex h-full gap-4">
        {/* ── Main content ── */}
        <div className="min-w-0 flex-1 space-y-8 overflow-y-auto p-5 sm:p-8">
          {/* ── Hero header ── */}
          <PageHero
            title="Punto de venta"
            ctaLabel="Nueva venta"
            onCta={openNewSale}
          />

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
                    onEditProduct={setEditProductId}
                  />
                )}

                {/* Recently sold */}
                {recentProducts && recentProducts.length > 0 && (
                  <POSProductCarousel
                    title="Vendidos recientemente"
                    icon={<Clock className="h-4 w-4" />}
                    products={recentProducts}
                    onAdd={handleAddProduct}
                    onEditProduct={setEditProductId}
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* ── Full product grid (in card) ── */}
          <POSProductGrid onAdd={handleAddProduct} onEditProduct={setEditProductId} />
        </div>

        {/* ── Sliding cart sidebar (desktop) ── */}
        <div className="hidden sm:block">
          <AnimatePresence>
            {items.length > 0 && (
              <POSSlidingCart onCheckout={openCheckout} />
            )}
          </AnimatePresence>
        </div>
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

      {/* ── Product edit dialog ── */}
      <ProductEditDialog
        open={!!editProductId}
        productId={editProductId}
        onClose={() => setEditProductId(null)}
      />
    </>
  )
}
