"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { useReactToPrint } from "react-to-print"
import { ShoppingCart, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { formatCurrency } from "@/lib/utils"

import { ProductSearch } from "./product-search"
import { CartPanel } from "./cart-panel"
import { CustomerPicker } from "./customer-picker"
import { PaymentDialog } from "./payment-dialog"
import { SaleReceipt, type ReceiptData } from "./sale-receipt"
import { usePOSStore } from "../store"

export function POSTerminal() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Subscribe to items directly so the component re-renders when cart changes
  const items = usePOSStore((s) => s.items)
  const globalDiscount = usePOSStore((s) => s.globalDiscount)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const itemsDiscount = items.reduce((sum, i) => sum + i.discount, 0)
  const total = Math.max(0, subtotal - itemsDiscount - globalDiscount)

  // Realtime: sync stock changes from other devices
  const stockKeys = useMemo(() => [["pos-products"], ["products"], ["inventory"]], [])
  useRealtimeSync("product_variants", stockKeys)
  const salesKeys = useMemo(() => [["sales"], ["dashboard"]], [])
  useRealtimeSync("sales", salesKeys)

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receiptData?.saleNumber ? `Recibo-${receiptData.saleNumber}` : "Recibo",
    pageStyle: "@page { size: 80mm auto; margin: 0; }",
  })

  const handleSaleComplete = useCallback(
    (saleNumber: string, data: ReceiptData) => {
      setReceiptData(data)
      setMobileCartOpen(false)
      setTimeout(() => {
        handlePrint()
      }, 300)
    },
    [handlePrint]
  )

  return (
    <>
      {/* ── Desktop layout (side by side) ── */}
      <div className="hidden md:flex h-[calc(100svh-80px)] lg:h-[calc(100svh-56px)] gap-0">
        {/* Left — Product search */}
        <div className="flex flex-1 flex-col gap-4 pr-4 border-r border-neutral-200">
          <CustomerPicker />
          <ProductSearch />
        </div>

        {/* Right — Cart */}
        <div className="flex w-80 lg:w-96 flex-col pl-2 pr-1 py-1">
          <CartPanel onCheckout={() => setCheckoutOpen(true)} />
        </div>
      </div>

      {/* ── Mobile layout (stacked with floating cart) ── */}
      <div className="flex md:hidden flex-col h-[calc(100svh-80px)] pb-16">
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          <CustomerPicker />
          <ProductSearch />
        </div>

        {/* Floating cart button */}
        <AnimatePresence>
          {itemCount > 0 && !mobileCartOpen && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-20 left-4 right-4 z-40"
            >
              <Button
                onClick={() => setMobileCartOpen(true)}
                size="lg"
                className="w-full shadow-lg rounded-xl h-14 text-base"
              >
                <ShoppingCart className="mr-2 size-5" />
                <Badge
                  variant="secondary"
                  className="mr-2 bg-white/20 text-white text-xs"
                >
                  {itemCount}
                </Badge>
                Ver carrito — {formatCurrency(total)}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-screen cart panel (slides up) */}
        <AnimatePresence>
          {mobileCartOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 bg-black/30"
                onClick={() => setMobileCartOpen(false)}
              />
              {/* Cart panel */}
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                }}
                exit={{
                  y: "100%",
                  transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
                }}
                className="fixed inset-0 z-50 bg-white flex flex-col"
              >
              {/* Mobile cart header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                <h2 className="text-base font-semibold text-neutral-950">
                  Carrito
                </h2>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setMobileCartOpen(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>

              {/* Cart content */}
              <div className="flex-1 overflow-y-auto">
                <CartPanel
                  onCheckout={() => {
                    setMobileCartOpen(false)
                    setCheckoutOpen(true)
                  }}
                />
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Payment dialog (shared) */}
      <PaymentDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onSaleComplete={handleSaleComplete}
      />

      {/* Hidden receipt for printing */}
      {receiptData && (
        <div className="hidden">
          <SaleReceipt ref={receiptRef} data={receiptData} />
        </div>
      )}
    </>
  )
}
