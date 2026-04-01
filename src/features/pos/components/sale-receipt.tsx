import { forwardRef } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/constants"

interface ReceiptItem {
  product_name: string
  variant_label: string
  quantity: number
  unit_price: number
  discount: number
  line_total: number
}

interface ReceiptPayment {
  method: string
  amount: number
}

export interface ReceiptData {
  saleNumber: string
  date: string
  customerName: string | null
  items: ReceiptItem[]
  payments: ReceiptPayment[]
  subtotal: number
  discountAmount: number
  total: number
  change: number
}

export const SaleReceipt = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  function SaleReceipt({ data }, ref) {
    const formattedDate = format(new Date(data.date), "dd/MM/yyyy HH:mm", {
      locale: es,
    })

    return (
      <div
        ref={ref}
        className="w-[80mm] mx-auto p-4 font-mono text-xs leading-relaxed"
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-neutral-400 pb-3 mb-3">
          <p className="text-sm font-bold">Eclat</p>
          <p className="text-[10px] text-neutral-500 mt-1">
            Zapopan, Jalisco
          </p>
        </div>

        {/* Sale info */}
        <div className="border-b border-dashed border-neutral-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span>Venta:</span>
            <span className="font-bold">{data.saleNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{formattedDate}</span>
          </div>
          {data.customerName && (
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="text-right max-w-[50%] truncate">
                {data.customerName}
              </span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-neutral-400 pb-3 mb-3">
          {data.items.map((item, i) => (
            <div key={i} className="mb-2">
              <p className="font-medium truncate">{item.product_name}</p>
              {item.variant_label !== item.product_name && (
                <p className="text-[10px] text-neutral-500 truncate">
                  {item.variant_label}
                </p>
              )}
              <div className="flex justify-between">
                <span>
                  {item.quantity} x {formatCurrency(item.unit_price)}
                </span>
                <span>{formatCurrency(item.line_total)}</span>
              </div>
              {item.discount > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Desc.</span>
                  <span>-{formatCurrency(item.discount)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-b border-dashed border-neutral-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(data.subtotal)}</span>
          </div>
          {data.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Descuento</span>
              <span>-{formatCurrency(data.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>TOTAL</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="border-b border-dashed border-neutral-400 pb-3 mb-3">
          {data.payments.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>
                {PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ??
                  p.method}
              </span>
              <span>{formatCurrency(p.amount)}</span>
            </div>
          ))}
          {data.change > 0 && (
            <div className="flex justify-between font-bold mt-1">
              <span>Cambio</span>
              <span>{formatCurrency(data.change)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-neutral-500">
          <p>Gracias por su compra</p>
        </div>
      </div>
    )
  }
)
