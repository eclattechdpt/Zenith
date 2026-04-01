"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { useReactToPrint } from "react-to-print"

import { useRealtimeSync } from "@/hooks/use-realtime"

import { ProductSearch } from "./product-search"
import { CartPanel } from "./cart-panel"
import { CustomerPicker } from "./customer-picker"
import { PaymentDialog } from "./payment-dialog"
import { SaleReceipt, type ReceiptData } from "./sale-receipt"

export function POSTerminal() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Realtime: sync stock changes from other devices
  const stockKeys = useMemo(() => [["pos-products"], ["products"], ["inventory"]], [])
  useRealtimeSync("product_variants", stockKeys)
  const salesKeys = useMemo(() => [["sales"], ["dashboard"]], [])
  useRealtimeSync("sales", salesKeys)

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receiptData?.saleNumber ?? "ticket",
  })

  const handleSaleComplete = useCallback(
    (saleNumber: string, data: ReceiptData) => {
      setReceiptData(data)
      // Print after a brief delay to allow render
      setTimeout(() => {
        handlePrint()
      }, 300)
    },
    [handlePrint]
  )

  return (
    <div className="flex h-[calc(100svh-80px)] lg:h-[calc(100svh-56px)] gap-0">
      {/* Left — Product search */}
      <div className="flex flex-1 flex-col gap-4 pr-4 border-r border-neutral-200">
        <CustomerPicker />
        <ProductSearch />
      </div>

      {/* Right — Cart */}
      <div className="flex w-80 lg:w-96 flex-col pl-4">
        <CartPanel onCheckout={() => setCheckoutOpen(true)} />
      </div>

      {/* Payment dialog */}
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
    </div>
  )
}
