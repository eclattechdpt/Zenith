"use client"

import { useState, useCallback, useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { usePOSStore } from "../store"
import { createSale, createPendingSale, completePendingSale } from "../actions"
import type { PendingSaleWithSummary, CartPayment } from "../types"

import type { ReceiptData } from "./sale-receipt"
import { WizardCustomerStep } from "./wizard-customer-step"
import { WizardPaymentStep } from "./wizard-payment-step"
import { WizardConfirmationStep } from "./wizard-confirmation-step"

// ── Types ──

type WizardMode = "from-cart" | "new-sale" | "complete-pending"

type StepKey = "customer" | "products" | "payment" | "confirmation"

interface POSSaleWizardProps {
  open: boolean
  onClose: () => void
  mode: WizardMode
  pendingSale?: PendingSaleWithSummary | null
  onPrint?: (data: ReceiptData) => void
}

// ── Step definitions per mode ──

const STEPS_BY_MODE: Record<WizardMode, StepKey[]> = {
  "from-cart": ["customer", "payment", "confirmation"],
  "new-sale": ["customer", "products", "payment", "confirmation"],
  "complete-pending": ["payment", "confirmation"],
}

const STEP_LABELS: Record<StepKey, string> = {
  customer: "Cliente",
  products: "Productos",
  payment: "Pago",
  confirmation: "Confirmar",
}

// ── Component ──

export function POSSaleWizard({
  open,
  onClose,
  mode,
  pendingSale,
  onPrint,
}: POSSaleWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [payments, setPayments] = useState<CartPayment[]>([])
  const [saleResult, setSaleResult] = useState<{ sale_number: string } | null>(
    null
  )

  const queryClient = useQueryClient()

  const items = usePOSStore((s) => s.items)
  const customer = usePOSStore((s) => s.customer)
  const globalDiscount = usePOSStore((s) => s.globalDiscount)
  const notes = usePOSStore((s) => s.notes)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const clear = usePOSStore((s) => s.clear)

  const steps = STEPS_BY_MODE[mode]
  const currentStep = steps[stepIndex]

  const total = useMemo(() => {
    if (mode === "complete-pending" && pendingSale) {
      return pendingSale.total
    }
    return getTotal()
  }, [mode, pendingSale, getTotal])

  // ── Navigation ──

  const goNext = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }, [steps.length])

  const goBack = useCallback(() => {
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const handlePaymentNext = useCallback(
    (paymentData: CartPayment[]) => {
      setPayments(paymentData)
      goNext()
    },
    [goNext]
  )

  // ── Sale completion ──

  const handleCompleteSale = useCallback(async () => {
    if (mode === "complete-pending" && pendingSale) {
      const result = await completePendingSale({
        sale_id: pendingSale.id,
        payments: payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          reference: p.reference,
        })),
      })

      if (result.error) {
        const errorMsg =
          "_form" in result.error
            ? (result.error._form as string[])[0]
            : "Error al completar la venta"
        toast.error(errorMsg)
        return
      }

      setSaleResult({
        sale_number: result.data!.sale_number,
      })
    } else {
      // from-cart or new-sale
      const saleItems = items.map((item) => ({
        product_variant_id: item.variantId,
        product_name: item.productName,
        variant_label: item.variantLabel,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        unit_cost: item.unitCost,
        discount: item.discount,
      }))

      const result = await createSale({
        customer_id: customer?.id ?? null,
        items: saleItems,
        payments: payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          reference: p.reference,
        })),
        discount_amount: globalDiscount,
        notes: notes || null,
      })

      if (result.error) {
        const errorMsg =
          "_form" in result.error
            ? (result.error._form as string[])[0]
            : "Error al crear la venta"
        toast.error(errorMsg)
        return
      }

      setSaleResult({
        sale_number: result.data!.sale_number,
      })
      clear()
    }

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    queryClient.invalidateQueries({ queryKey: ["pos"] })
    queryClient.invalidateQueries({ queryKey: ["pending-sales"] })
  }, [
    mode,
    pendingSale,
    items,
    customer,
    globalDiscount,
    notes,
    payments,
    clear,
    queryClient,
  ])

  // ── Pending sale (save for later) ──

  const handlePendingSale = useCallback(async () => {
    const saleItems = items.map((item) => ({
      product_variant_id: item.variantId,
      product_name: item.productName,
      variant_label: item.variantLabel,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unit_cost: item.unitCost,
      discount: item.discount,
    }))

    const result = await createPendingSale({
      customer_id: customer?.id ?? null,
      items: saleItems,
      discount_amount: globalDiscount,
      notes: notes || null,
    })

    if (result.error) {
      const errorMsg =
        "_form" in result.error
          ? (result.error._form as string[])[0]
          : "Error al guardar venta pendiente"
      toast.error(errorMsg)
      return
    }

    setSaleResult({
      sale_number: result.data!.sale_number,
    })
    clear()

    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["pending-sales"] })
    queryClient.invalidateQueries({ queryKey: ["pos"] })
  }, [items, customer, globalDiscount, notes, clear, queryClient])

  // ── Print ──

  const handlePrint = useCallback(() => {
    if (!saleResult || !onPrint) return

    const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)

    if (mode === "complete-pending" && pendingSale) {
      // Build receipt from pending sale data
      onPrint({
        saleNumber: saleResult.sale_number,
        date: new Date().toISOString(),
        customerName: pendingSale.customer?.name ?? null,
        items: pendingSale.items.map((i) => ({
          product_name: i.product_name,
          variant_label: i.variant_label,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount,
          line_total: i.line_total,
        })),
        payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
        subtotal: pendingSale.subtotal,
        discountAmount: pendingSale.discount_amount,
        total: pendingSale.total,
        change: Math.max(0, paymentTotal - pendingSale.total),
      })
    } else {
      // Build receipt from cart data
      const subtotal = getTotal() + getItemsDiscount() + globalDiscount
      const totalVal = getTotal()
      onPrint({
        saleNumber: saleResult.sale_number,
        date: new Date().toISOString(),
        customerName: customer?.name ?? null,
        items: items.map((i) => ({
          product_name: i.productName,
          variant_label: i.variantLabel,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          discount: i.discount,
          line_total: Math.max(0, i.unitPrice * i.quantity - i.discount),
        })),
        payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
        subtotal,
        discountAmount: getItemsDiscount() + globalDiscount,
        total: totalVal,
        change: Math.max(0, paymentTotal - totalVal),
      })
    }
  }, [onPrint, saleResult, mode, pendingSale, payments, items, customer, globalDiscount, getTotal, getItemsDiscount])

  // ── Close & reset ──

  const handleClose = useCallback(() => {
    setStepIndex(0)
    setPayments([])
    setSaleResult(null)
    onClose()
  }, [onClose])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-0 sm:rounded-2xl">
        <DialogTitle className="sr-only">
          {mode === "complete-pending"
            ? "Completar venta pendiente"
            : mode === "new-sale"
              ? "Nueva venta"
              : "Cobrar"}
        </DialogTitle>

        {/* Step progress indicator */}
        {!saleResult && (
          <div className="flex items-center gap-1 border-b border-stone-100 px-6 pt-5 pb-4">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-1 items-center gap-1">
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                      index < stepIndex
                        ? "bg-teal-500 text-white"
                        : index === stepIndex
                          ? "bg-rose-600 text-white"
                          : "bg-stone-100 text-stone-400"
                    )}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium transition-colors",
                      index === stepIndex
                        ? "text-stone-800"
                        : "text-stone-400"
                    )}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mb-4 h-0.5 flex-1 rounded-full transition-colors",
                      index < stepIndex ? "bg-teal-500" : "bg-stone-100"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Close button */}
        {!saleResult && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-md p-1 text-stone-400 transition-colors hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Step content */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep + (saleResult ? "-done" : "")}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === "customer" && (
                <WizardCustomerStep onNext={goNext} />
              )}

              {currentStep === "products" && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <p className="text-sm text-stone-500">
                    Agrega productos al carrito desde el POS
                  </p>
                </div>
              )}

              {currentStep === "payment" && (
                <WizardPaymentStep
                  total={total}
                  onNext={handlePaymentNext}
                  onBack={goBack}
                />
              )}

              {currentStep === "confirmation" && (
                <WizardConfirmationStep
                  payments={payments}
                  onCompleteSale={handleCompleteSale}
                  onPendingSale={handlePendingSale}
                  onPrint={handlePrint}
                  onBack={goBack}
                  saleResult={saleResult}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export type { WizardMode, POSSaleWizardProps }
