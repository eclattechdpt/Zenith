"use client"

import { useState, useEffect } from "react"
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  FileText,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants"
import { NumericInput } from "@/features/productos/components/variant-manager"

import { usePOSStore } from "../store"
import { createSale } from "../actions"
import { useCustomerCreditNotes } from "../queries"
import type { CartPayment } from "../types"
import type { ReceiptData } from "./sale-receipt"

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="size-4" />,
  card: <CreditCard className="size-4" />,
  transfer: <ArrowRightLeft className="size-4" />,
  credit_note: <FileText className="size-4" />,
}

const QUICK_METHODS: PaymentMethod[] = ["cash", "card", "transfer"]

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaleComplete: (saleNumber: string, receiptData: ReceiptData) => void
}

export function PaymentDialog({
  open,
  onOpenChange,
  onSaleComplete,
}: PaymentDialogProps) {
  const queryClient = useQueryClient()
  const items = usePOSStore((s) => s.items)
  const customer = usePOSStore((s) => s.customer)
  const globalDiscount = usePOSStore((s) => s.globalDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const notes = usePOSStore((s) => s.notes)
  const clear = usePOSStore((s) => s.clear)

  const subtotal = getSubtotal()
  const itemsDiscount = getItemsDiscount()
  const total = getTotal()
  const [payments, setPayments] = useState<CartPayment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Credit notes for current customer
  const { data: creditNotes = [], isLoading: isLoadingCredits } =
    useCustomerCreditNotes(customer?.id ?? null)
  const hasCreditNotes = creditNotes.length > 0

  // Reset payments to full cash whenever the dialog opens or total changes
  useEffect(() => {
    if (open) {
      setPayments([{ method: "cash", amount: total, reference: null }])
    }
  }, [open, total])

  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = Math.max(0, total - paymentTotal)
  const change = Math.max(0, paymentTotal - total)
  const isValid = total === 0 || (paymentTotal >= total && payments.every((p) => p.amount > 0))

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
      prev.map((p, i) => {
        if (i !== index) return p
        // Cap credit note payments to remaining_amount
        if (p.method === "credit_note" && p.reference) {
          const cn = creditNotes.find((c) => c.id === p.reference)
          if (cn) {
            amount = Math.min(amount, Number(cn.remaining_amount))
          }
        }
        return { ...p, amount }
      })
    )
  }

  function updatePaymentReference(index: number, reference: string) {
    setPayments((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, reference: reference || null } : p
      )
    )
  }

  function setFullCash() {
    setPayments([{ method: "cash", amount: total, reference: null }])
  }

  function setFullCard() {
    setPayments([{ method: "card", amount: total, reference: null }])
  }

  function addCreditNotePayment(creditNoteId: string, maxAmount: number) {
    const amount = Math.min(maxAmount, remaining > 0 ? remaining : total)
    setPayments((prev) => [
      ...prev,
      { method: "credit_note", amount, reference: creditNoteId },
    ])
  }

  async function handleConfirm() {
    setIsSubmitting(true)

    const result = await createSale({
      customer_id: customer?.id ?? null,
      items: items.map((item) => ({
        product_variant_id: item.variantId,
        product_name: item.productName,
        variant_label: item.variantLabel,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        unit_cost: item.unitCost,
        discount: item.discount,
      })),
      payments: total === 0 ? [] : payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference,
      })),
      discount_amount: globalDiscount,
      notes: notes || null,
    })

    setIsSubmitting(false)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al crear la venta"
      toast.error(msg)
      return
    }

    const sale = result.data
    toast.success(`Venta ${sale.sale_number} completada`)

    // Build receipt data before clearing the cart
    const receiptData: ReceiptData = {
      saleNumber: sale.sale_number,
      date: sale.created_at,
      customerName: customer?.name ?? null,
      items: items.map((item) => ({
        product_name: item.productName,
        variant_label: item.variantLabel,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        line_total: item.unitPrice * item.quantity - item.discount,
      })),
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
      })),
      subtotal,
      discountAmount: itemsDiscount + globalDiscount,
      total,
      change,
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["pos-products"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    queryClient.invalidateQueries({ queryKey: ["credit-notes"] })

    clear()
    onOpenChange(false)
    onSaleComplete(sale.sale_number, receiptData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrar</DialogTitle>
        </DialogHeader>

        {/* Total */}
        <div className="text-center py-3 border-b border-neutral-100">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">
            Total a cobrar
          </p>
          <p className="text-3xl font-bold text-neutral-950 mt-1 tabular-nums">
            {formatCurrency(total)}
          </p>
          {customer && (
            <p className="text-xs text-teal-600 mt-1">{customer.name}</p>
          )}
        </div>

        {/* Quick payment buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={setFullCash}
            className="flex-1"
          >
            <Banknote className="mr-1.5 size-4" />
            Efectivo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={setFullCard}
            className="flex-1"
          >
            <CreditCard className="mr-1.5 size-4" />
            Tarjeta
          </Button>
        </div>

        {/* Credit notes available */}
        {customer && isLoadingCredits && (
          <div className="text-xs text-teal-600 flex items-center gap-1.5 py-2">
            <Loader2 className="size-3 animate-spin" />
            Cargando notas de credito...
          </div>
        )}
        {hasCreditNotes && (
          <div className="border border-teal-100 rounded-lg p-3 bg-teal-50/30">
            <p className="text-xs text-teal-700 font-medium mb-2 flex items-center gap-1.5">
              <FileText className="size-3.5" />
              Notas de credito disponibles
            </p>
            <div className="space-y-1.5">
              {creditNotes.map((cn) => {
                const alreadyUsed = payments.some(
                  (p) =>
                    p.method === "credit_note" && p.reference === cn.id
                )
                return (
                  <button
                    key={cn.id}
                    onClick={() =>
                      addCreditNotePayment(
                        cn.id,
                        Number(cn.remaining_amount)
                      )
                    }
                    disabled={alreadyUsed || remaining <= 0}
                    className="w-full flex items-center justify-between text-xs p-2 rounded-md hover:bg-teal-100/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="font-medium text-teal-800">
                      {cn.credit_number}
                      {alreadyUsed && (
                        <Badge
                          variant="outline"
                          className="ml-1.5 text-[9px] py-0 px-1"
                        >
                          Agregada
                        </Badge>
                      )}
                    </span>
                    <span className="tabular-nums text-teal-600">
                      {formatCurrency(Number(cn.remaining_amount))}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Payment lines */}
        <div className="flex flex-col gap-3">
          {payments.map((payment, index) => {
            const cnInfo =
              payment.method === "credit_note"
                ? creditNotes.find((cn) => cn.id === payment.reference)
                : null

            return (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs text-neutral-500">
                  {PAYMENT_ICONS[payment.method]}{" "}
                  {PAYMENT_METHODS[payment.method]}
                  {cnInfo && (
                    <span className="ml-1 text-teal-600">
                      ({cnInfo.credit_number})
                    </span>
                  )}
                </Label>
                <NumericInput
                  decimal
                  value={payment.amount}
                  onChange={(v) => updatePaymentAmount(index, v)}
                  prefix="$"
                />
              </div>
              {(payment.method === "transfer" ||
                payment.method === "other") && (
                <div className="w-32">
                  <Label className="text-xs text-neutral-500">
                    Referencia
                  </Label>
                  <Input
                    placeholder="Ref."
                    value={payment.reference ?? ""}
                    onChange={(e) =>
                      updatePaymentReference(index, e.target.value)
                    }
                    className="h-8"
                  />
                </div>
              )}
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
            )
          })}

          {/* Add split payment */}
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
          disabled={!isValid || isSubmitting}
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
      </DialogContent>
    </Dialog>
  )
}
