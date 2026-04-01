"use client"

import { useState } from "react"
import { Check, Clock, Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/constants"
import { usePOSStore } from "../store"
import type { CartPayment } from "../types"

interface WizardConfirmationStepProps {
  payments: CartPayment[]
  onCompleteSale: () => Promise<void>
  onPendingSale: () => Promise<void>
  onPrint: () => void
  onBack: () => void
  saleResult: { sale_number: string } | null
}

export function WizardConfirmationStep({ payments, onCompleteSale, onPendingSale, onPrint, onBack, saleResult }: WizardConfirmationStepProps) {
  const items = usePOSStore((s) => s.items)
  const customer = usePOSStore((s) => s.customer)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)
  const [submitting, setSubmitting] = useState<"complete" | "pending" | null>(null)

  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const change = paymentTotal > getTotal() ? paymentTotal - getTotal() : 0

  const handleComplete = async () => {
    setSubmitting("complete")
    try { await onCompleteSale() } finally { setSubmitting(null) }
  }

  const handlePending = async () => {
    setSubmitting("pending")
    try { await onPendingSale() } finally { setSubmitting(null) }
  }

  if (saleResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <Check className="h-8 w-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-bold text-stone-800">Venta completada</h3>
        <p className="text-sm text-stone-500">Folio: <span className="font-semibold">{saleResult.sale_number}</span></p>
        <Button onClick={onPrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" /> Imprimir ticket
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-1 text-lg font-bold text-stone-800">Confirmar venta</h3>
        <p className="text-sm text-stone-500">Revisa los detalles antes de confirmar</p>
      </div>

      {customer && (
        <div className="rounded-lg bg-teal-50 p-3">
          <p className="text-xs font-medium text-teal-700">Cliente</p>
          <p className="text-sm font-semibold text-stone-800">{customer.name}</p>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-stone-200 p-3">
        <p className="text-xs font-medium text-stone-500">Productos</p>
        {items.map((item) => (
          <div key={item.variantId} className="flex items-center justify-between text-sm">
            <span className="text-stone-700">{item.productName} <span className="text-stone-400">× {item.quantity}</span></span>
            <span className="font-medium text-stone-800">{formatCurrency(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-3">
        <div className="flex justify-between text-sm text-stone-600">
          <span>Subtotal</span><span>{formatCurrency(getSubtotal())}</span>
        </div>
        {getItemsDiscount() > 0 && (
          <div className="flex justify-between text-sm text-teal-600">
            <span>Descuento</span><span>-{formatCurrency(getItemsDiscount())}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-stone-200 pt-1 text-base font-extrabold">
          <span className="text-stone-800">Total</span>
          <span className="text-rose-600">{formatCurrency(getTotal())}</span>
        </div>
      </div>

      <div className="space-y-1 rounded-lg border border-stone-200 p-3">
        <p className="text-xs font-medium text-stone-500">Pagos</p>
        {payments.map((p, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-stone-700">{PAYMENT_METHODS[p.method]}{p.reference ? ` (${p.reference})` : ""}</span>
            <span className="font-medium">{formatCurrency(p.amount)}</span>
          </div>
        ))}
        {change > 0 && (
          <div className="flex justify-between border-t border-stone-200 pt-1 text-sm font-medium text-teal-600">
            <span>Cambio</span><span>{formatCurrency(change)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleComplete} disabled={submitting !== null} className="h-11 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50">
          {submitting === "complete" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Completar venta
        </Button>
        <Button variant="outline" onClick={handlePending} disabled={submitting !== null} className="h-10 gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
          {submitting === "pending" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
          Confirmar después
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={submitting !== null} className="text-stone-500">
          Atrás
        </Button>
      </div>
    </div>
  )
}
