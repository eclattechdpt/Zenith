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
  Tag,
  Percent,
  X,
} from "lucide-react"
import { sileo } from "sileo"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, cn } from "@/lib/utils"
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants"
import { usePriceLists } from "@/features/clientes/queries"
import { NumericInput } from "@/features/productos/components/variant-manager"

import { usePOSStore } from "../store"
import { createSale } from "../actions"
import type { CartPayment } from "../types"
import type { ReceiptData } from "./sale-receipt"

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="size-4" />,
  card: <CreditCard className="size-4" />,
  transfer: <ArrowRightLeft className="size-4" />,
  credit_note: <Banknote className="size-4" />,
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
  const setGlobalDiscount = usePOSStore((s) => s.setGlobalDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const notes = usePOSStore((s) => s.notes)
  const clear = usePOSStore((s) => s.clear)

  const { data: priceLists = [] } = usePriceLists()
  const activeDiscounts = priceLists.filter((pl) => Number(pl.discount_percent) > 0)

  const subtotal = getSubtotal()
  const itemsDiscount = getItemsDiscount()
  const total = getTotal()
  const [payments, setPayments] = useState<CartPayment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [customInputOpen, setCustomInputOpen] = useState(false)
  const [discountMode, setDiscountMode] = useState<"percent" | "fixed">("percent")
  const [discountInput, setDiscountInput] = useState("")

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
      prev.map((p, i) => (i !== index ? p : { ...p, amount }))
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
      sileo.error({ title: msg })
      return
    }

    const sale = result.data
    sileo.success({ title: `Venta ${sale.sale_number} completada`, description: "La venta fue registrada y el inventario actualizado" })

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

        {/* Total + discount */}
        <div className="py-3 border-b border-neutral-100">
          <div className="text-center">
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

          {/* Discount display */}
          {globalDiscount > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-rose-50/60 border border-rose-100 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                <Tag className="size-3" />
                Descuento aplicado
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-500 tabular-nums">
                  -{formatCurrency(globalDiscount)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setGlobalDiscount(0)
                    setDiscountInput("")
                    setDiscountOpen(false)
                    setCustomInputOpen(false)
                  }}
                  className="flex size-5 items-center justify-center rounded text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          )}

          {/* Add discount button */}
          {globalDiscount === 0 && !discountOpen && (
            <button
              type="button"
              onClick={() => { setDiscountOpen(true); setCustomInputOpen(false) }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-rose-200 bg-rose-50/40 py-2 text-xs font-semibold text-rose-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
            >
              <Tag className="size-3.5" />
              Agregar descuento
            </button>
          )}

          {/* Discount picker */}
          {discountOpen && globalDiscount === 0 && (
            <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/40 p-2.5 space-y-2">
              {!customInputOpen && (
                <>
                  {activeDiscounts.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => {
                        const pct = Number(pl.discount_percent)
                        const amount = Math.round(subtotal * (pct / 100) * 100) / 100
                        setGlobalDiscount(amount)
                        setDiscountOpen(false)
                      }}
                      className="flex w-full items-center justify-between rounded-lg bg-white border border-neutral-200/80 px-3 py-2.5 text-xs transition-colors hover:border-rose-200 hover:bg-rose-50/50"
                    >
                      <span className="font-medium text-neutral-700">{pl.name}</span>
                      <span className="font-bold text-rose-500 tabular-nums">-{Number(pl.discount_percent)}%</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomInputOpen(true)}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-200 py-2 text-[11px] font-semibold text-neutral-400 transition-colors hover:border-rose-200 hover:text-rose-500"
                  >
                    <Percent className="size-3" />
                    Personalizado
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountOpen(false); setDiscountInput("") }}
                    className="flex w-full items-center justify-center py-1 text-[11px] font-semibold text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}

              {customInputOpen && (
                <>
                  <div className="flex items-center gap-1 rounded-lg bg-white border border-neutral-200/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => { setDiscountMode("percent"); setDiscountInput("") }}
                      className={cn(
                        "flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all",
                        discountMode === "percent"
                          ? "bg-rose-500 text-white shadow-sm"
                          : "text-neutral-500 hover:text-rose-600"
                      )}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDiscountMode("fixed"); setDiscountInput("") }}
                      className={cn(
                        "flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all",
                        discountMode === "fixed"
                          ? "bg-rose-500 text-white shadow-sm"
                          : "text-neutral-500 hover:text-rose-600"
                      )}
                    >
                      $
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={discountMode === "percent" ? 100 : subtotal}
                      step="any"
                      placeholder={discountMode === "percent" ? "Ej: 10" : "Ej: 50"}
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-neutral-200/80 bg-white px-2.5 text-sm tabular-nums outline-none focus:border-rose-200 focus:ring-2 focus:ring-rose-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseFloat(discountInput)
                        if (isNaN(val) || val <= 0) return
                        const amount = discountMode === "percent"
                          ? Math.round(subtotal * (val / 100) * 100) / 100
                          : Math.min(val, subtotal)
                        setGlobalDiscount(amount)
                        setDiscountOpen(false)
                        setCustomInputOpen(false)
                      }}
                      className="flex h-8 items-center justify-center rounded-lg bg-rose-500 px-3 text-[11px] font-semibold text-white hover:bg-rose-600 transition-colors"
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCustomInputOpen(false); setDiscountInput("") }}
                      className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
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
          ))}

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
