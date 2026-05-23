"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { Flame, Clock, Package } from "lucide-react"
import { PageHero } from "@/components/shared/page-hero"
import { useReactToPrint } from "react-to-print"

import { useRealtimeSync } from "@/hooks/use-realtime"
import { formatCurrency, sortVariantsBySku } from "@/lib/utils"

import { usePOSStore } from "../store"
import { resolvePrice } from "../utils"
import {
  useTopSellingProducts,
  useRecentlySoldProducts,
} from "../queries"
import type { POSProductWithImage } from "../queries"
import type { PendingSaleWithSummary } from "../types"
import type { ReceiptData } from "./sale-receipt"
import { SaleReceipt } from "./sale-receipt"

import { POSKpiWidgets } from "./pos-kpi-widgets"
import { POSPendingSales } from "./pos-pending-sales"
import { POSProductCarousel } from "./pos-product-carousel"
import { POSProductGrid } from "./pos-product-grid"
import { POSSaleWizard } from "./pos-sale-wizard"
import { ProductEditDialog } from "@/features/productos/components/product-edit-dialog"

// ── Types ──

type WizardMode = "new-sale" | "complete-pending"

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
  const searchParams = useSearchParams()

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
    pageStyle: "@page { size: 80mm auto; margin: 0; }",
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

  // ── Wizard openers ──
  const openNewSale = useCallback(() => {
    setWizardMode("new-sale")
    setPendingSale(null)
    setWizardOpen(true)
  }, [])

  // ── Variant picker (landing) ──
  // Productos con varias variantes activas (e.g. Rimel · "De Luxe" / "Original")
  // muestran un picker antes de agregar, en vez de auto-elegir la primera.
  const [variantPickerProduct, setVariantPickerProduct] =
    useState<POSProductWithImage | null>(null)

  // Confirmación para productos sin stock (candidatos a vale). Mismo flujo que
  // el paso Productos del wizard: agregar OOS abre un diálogo antes de meterlo
  // al carrito como vale.
  const [pendingOosProduct, setPendingOosProduct] =
    useState<POSProductWithImage | null>(null)
  const [pendingOosVariant, setPendingOosVariant] = useState<
    POSProductWithImage["product_variants"][number] | null
  >(null)

  const addVariantToCart = useCallback(
    async (
      product: POSProductWithImage,
      variant: POSProductWithImage["product_variants"][number]
    ) => {
      const existingItem = items.find((i) => i.variantId === variant.id)

      // Para cofres, el stock se deriva del mínimo de sus componentes.
      const isBundle = product.is_bundle && product.bundle_items?.length > 0
      const availableStock = isBundle
        ? Math.min(
            ...product.bundle_items.map((bi) =>
              Math.max(0, bi.product_variants.stock - bi.product_variants.reserved_stock)
            )
          )
        : Math.max(0, variant.stock - variant.reserved_stock)

      // Con stock: no exceder lo disponible. Sin stock (candidato a vale):
      // permitir cantidad ilimitada — el wizard lo enruta a un vale.
      if (availableStock > 0 && existingItem && existingItem.quantity >= availableStock) return

      let price = variant.price
      if (customer) {
        try {
          price = await resolvePrice(variant.id, variant.price, customer.priceListId)
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
        isBundle,
        bundleComponents: isBundle
          ? product.bundle_items.map((bi) => ({
              variantId: bi.product_variant_id,
              productName: bi.product_variants.products.name,
              variantLabel: bi.product_variants.name ?? bi.product_variants.sku ?? "Unica",
              stock: Math.max(0, bi.product_variants.stock - bi.product_variants.reserved_stock),
            }))
          : undefined,
      })

      if (!wizardOpen) openNewSale()
    },
    [items, addItem, customer, wizardOpen, openNewSale]
  )

  // ── Add product to cart (shared by carousels and grid) ──
  // Adding from the landing auto-opens the wizard. The wizard owns the cart UI
  // end-to-end; there is no separate cart panel on the landing anymore.
  const handleAddProduct = useCallback(
    async (product: POSProductWithImage) => {
      const activeVariants = product.product_variants.filter((v) => v.is_active)
      if (activeVariants.length === 0) return

      // Multi-variante → abrir picker en vez de auto-elegir la primera
      if (product.has_variants && activeVariants.length > 1) {
        setVariantPickerProduct(product)
        return
      }

      // Variante única → agregar directo, pero si está OOS pedir confirmación
      // (se venderá como vale).
      const variant = activeVariants[0]
      const isBundle = product.is_bundle && product.bundle_items?.length > 0
      const availableStock = isBundle
        ? Math.min(
            ...product.bundle_items.map((bi) =>
              Math.max(0, bi.product_variants.stock - bi.product_variants.reserved_stock)
            )
          )
        : Math.max(0, variant.stock - variant.reserved_stock)
      const existingItem = items.find((i) => i.variantId === variant.id)

      if (availableStock === 0 && !existingItem) {
        setPendingOosProduct(product)
        return
      }

      await addVariantToCart(product, variant)
    },
    [addVariantToCart, items]
  )

  // Selección desde el picker multi-variante. Variantes OOS pasan por el diálogo
  // de confirmación de vale; las que tienen stock se agregan directo.
  const handlePickVariant = useCallback(
    async (variant: POSProductWithImage["product_variants"][number]) => {
      if (!variantPickerProduct) return
      const availableStock = Math.max(0, variant.stock - variant.reserved_stock)
      const existingItem = items.find((i) => i.variantId === variant.id)

      if (availableStock === 0 && !existingItem) {
        setPendingOosVariant(variant)
        setPendingOosProduct(variantPickerProduct)
        setVariantPickerProduct(null)
        return
      }

      const product = variantPickerProduct
      setVariantPickerProduct(null)
      await addVariantToCart(product, variant)
    },
    [addVariantToCart, variantPickerProduct, items]
  )

  const openCompletePending = useCallback((sale: PendingSaleWithSummary) => {
    setWizardMode("complete-pending")
    setPendingSale(sale)
    setWizardOpen(true)
  }, [])

  // Auto-open wizard when navigating with ?action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openNewSale()
      window.history.replaceState(null, "", "/pos")
    }
  }, [searchParams, openNewSale])

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
      <div className="flex h-full">
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
      </div>

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

      {/* ── Variant picker (multi-variant products) ── */}
      {variantPickerProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                <Package className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {variantPickerProduct.name}
                </h3>
                {variantPickerProduct.brand && (
                  <p className="text-xs text-neutral-400">{variantPickerProduct.brand}</p>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Selecciona una variante
            </p>
            <div className="mt-2 max-h-60 space-y-1.5 overflow-y-auto">
              {sortVariantsBySku(
                variantPickerProduct.product_variants.filter((v) => v.is_active)
              ).map((variant) => {
                const availableStock = Math.max(0, variant.stock - variant.reserved_stock)
                const existingItem = items.find((i) => i.variantId === variant.id)
                const isFull = availableStock > 0 && existingItem && existingItem.quantity >= availableStock
                const isOos = availableStock === 0
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!!isFull}
                    onClick={() => handlePickVariant(variant)}
                    className="flex w-full items-center justify-between rounded-xl border border-neutral-200/80 bg-white px-4 py-3 text-left transition-colors hover:border-rose-200 hover:bg-rose-50/50 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-800 truncate">
                        {variant.name ?? variant.sku ?? "Variante"}
                      </p>
                      {variant.sku && variant.name && (
                        <p className="text-xs text-neutral-400">{variant.sku}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-neutral-900 tabular-nums">
                        {formatCurrency(variant.price)}
                      </p>
                      <p className={`text-[10px] font-semibold ${
                        isOos ? "text-red-500" : availableStock <= 5 ? "text-amber-500" : "text-emerald-500"
                      }`}>
                        {isOos ? "Sin stock" : `${availableStock} en stock`}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setVariantPickerProduct(null)}
              className="mt-4 flex h-10 w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmación: producto sin stock → vale ── */}
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
              <span className="font-semibold text-neutral-700">
                &quot;{pendingOosProduct.name}
                {pendingOosVariant ? ` — ${pendingOosVariant.name}` : ""}&quot;
              </span>{" "}
              no tiene stock disponible. Solo se podra vender como vale — el
              cliente recibira el producto cuando se reabastezca.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingOosProduct(null)
                  setPendingOosVariant(null)
                }}
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const product = pendingOosProduct
                  const variant =
                    pendingOosVariant ??
                    product.product_variants.filter((v) => v.is_active)[0]
                  if (product && variant) await addVariantToCart(product, variant)
                  setPendingOosProduct(null)
                  setPendingOosVariant(null)
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
