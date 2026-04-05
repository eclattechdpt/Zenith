"use client"

import { useState, useEffect } from "react"
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants"
import { NumericInput } from "@/features/productos/components/variant-manager"

import { useQuoteDetail } from "../queries"
import { convertQuoteToSale } from "../actions"

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="size-4" />,
  card: <CreditCard className="size-4" />,
  transfer: <ArrowRightLeft className="size-4" />,
}

const QUICK_METHODS: PaymentMethod[] = ["cash", "card", "transfer"]

interface Payment {
  method: PaymentMethod
  amount: number
  reference: string | null
}

interface ConvertQuoteDialogProps {
  quoteId: string | null
  onOpenChange: (open: boolean) => void
  onConverted: () => void
}

export function ConvertQuoteDialog({
  quoteId,
  onOpenChange,
  onConverted,
}: ConvertQuoteDialogProps) {
  const queryClient = useQueryClient()
  const { data: quote, isLoading } = useQuoteDetail(quoteId)
  const total = Number(quote?.total ?? 0)

  const [payments, setPayments] = useState<Payment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (quoteId && total > 0) {
      setPayments([{ method: "cash", amount: total, reference: null }])
    }
  }, [quoteId, total])

  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = Math.max(0, total - paymentTotal)
  const change = Math.max(0, paymentTotal - total)
  const isValid =
    total === 0 || (paymentTotal >= total && payments.every((p) => p.amount > 0))

  function addPayment(method: PaymentMethod) {
    setPayments((prev) => [
      ...prev,
      { method, amount: remaining, reference: null },
    ])
  }

  function removePayment(index: number) {
    setPayments((prev) => prev.filter((_, i) => i !== index))
  }

  function updatePaymentAmount(index: number, amount: number) {
    setPayments((prev) =>
      prev.map((p, i) => (i === index ? { ...p, amount } : p))
    )
  }

  async function handleConfirm() {
    if (!quoteId || isSubmitting) return
    setIsSubmitting(true)

    const result = await convertQuoteToSale({
      quote_id: quoteId,
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference,
      })),
    })

    setIsSubmitting(false)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al convertir la cotizacion"
      toast.error(msg)
      return
    }

    const sale = result.data
    toast.success(`Venta ${sale.sale_number} creada desde cotizacion`)

    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["pos-products"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })

    onOpenChange(false)
    onConverted()
  }

  return (
    <Dialog open={!!quoteId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convertir cotizacion a venta</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-neutral-400" />
          </div>
        ) : quote ? (
          <>
            {/* Quote summary */}
            <div className="text-center py-3 border-b border-neutral-100">
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                {quote.sale_number}
              </p>
              <p className="text-3xl font-bold text-neutral-950 mt-1 tabular-nums">
                {formatCurrency(total)}
              </p>
              {quote.customers && (
                <p className="text-xs text-teal-600 mt-1">
                  {quote.customers.name}
                </p>
              )}
            </div>

            {/* Items preview */}
            <div className="max-h-32 overflow-y-auto border-b border-neutral-100 py-2">
              {(quote.sale_items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-xs text-neutral-600 py-0.5"
                >
                  <span className="truncate flex-1 mr-2">
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="tabular-nums shrink-0">
                    {formatCurrency(Number(item.line_total))}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick payment buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPayments([
                    { method: "cash", amount: total, reference: null },
                  ])
                }
                className="flex-1"
              >
                <Banknote className="mr-1.5 size-4" />
                Efectivo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPayments([
                    { method: "card", amount: total, reference: null },
                  ])
                }
                className="flex-1"
              >
                <CreditCard className="mr-1.5 size-4" />
                Tarjeta
              </Button>
            </div>

            {/* Payment lines */}
            <div className="flex flex-col gap-3">
              {payments.map((payment, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-neutral-500">
                      {PAYMENT_ICONS[payment.method]}{" "}
                      {PAYMENT_METHODS[payment.method]}
                    </Label>
                    <NumericInput
                      decimal
                      value={payment.amount}
                      onChange={(v) => updatePaymentAmount(index, v)}
                      prefix="$"
                    />
                  </div>
                  {payments.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removePayment(index)}
                      className="text-neutral-400 hover:text-destructive mb-1"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}

              {remaining > 0 && (
                <div className="flex gap-1.5">
                  {QUICK_METHODS.filter(
                    (m) => !payments.some((p) => p.method === m)
                  ).map((method) => (
                    <Button
                      key={method}
                      variant="ghost"
                      size="sm"
                      onClick={() => addPayment(method)}
                      className="text-xs"
                    >
                      <Plus className="mr-1 size-3" />
                      {PAYMENT_METHODS[method]}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="border-t border-neutral-100 pt-3 space-y-1.5">
              {remaining > 0 && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Falta</span>
                  <span>{formatCurrency(remaining)}</span>
                </div>
              )}
              {change > 0 && (
                <div className="flex justify-between text-sm font-medium text-emerald-600">
                  <span>Cambio</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <Button
              onClick={handleConfirm}
              disabled={!isValid || isSubmitting || isLoading}
              size="lg"
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 size-4" />
              )}
              Confirmar venta
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
