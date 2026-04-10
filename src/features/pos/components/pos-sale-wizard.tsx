"use client"

import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "motion/react"
import { X, Check } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { sileo } from "sileo"
import { useOnlineStatus } from "@/hooks/use-online-status"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { usePOSStore } from "../store"
import { createSale, createPendingSale, completePendingSale } from "../actions"
import { createVale } from "@/features/vales/actions"
import type { PendingSaleWithSummary, CartPayment } from "../types"

import type { ReceiptData } from "./sale-receipt"
import { WizardCustomerStep } from "./wizard-customer-step"
import { WizardProductsStep } from "./wizard-products-step"
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
  const [receiptSnapshot, setReceiptSnapshot] = useState<ReceiptData | null>(null)
  const [wasPending, setWasPending] = useState(false)

  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const items = usePOSStore((s) => s.items)
  const customer = usePOSStore((s) => s.customer)
  const globalDiscount = usePOSStore((s) => s.globalDiscount)
  const notes = usePOSStore((s) => s.notes)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const clear = usePOSStore((s) => s.clear)

  const steps = STEPS_BY_MODE[mode]
  const currentStep = steps[stepIndex]

  // No useMemo — getTotal() is a stable Zustand function ref that reads
  // current store state on each call.  Memoizing it would cache a stale
  // value because the ref itself never changes when cart items change.
  const total =
    mode === "complete-pending" && pendingSale
      ? pendingSale.total
      : getTotal()

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

  // ── Receipt snapshot helper (captures store data before clear) ──

  const buildReceiptSnapshot = useCallback((saleNumber: string): ReceiptData => {
    const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
    if (mode === "complete-pending" && pendingSale) {
      return {
        saleNumber,
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
      }
    }
    const subtotal = getTotal() + getItemsDiscount() + globalDiscount
    const totalVal = getTotal()
    return {
      saleNumber,
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
    }
  }, [mode, pendingSale, items, customer, payments, globalDiscount, getTotal, getItemsDiscount])

  // ── Sale completion ──

  const handleCompleteSale = useCallback(async () => {
    if (!isOnline) {
      sileo.error({ title: "Sin conexion", description: "Revisa tu conexion a internet e intenta de nuevo." })
      return
    }
    try {
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
          const msg =
            "_form" in result.error
              ? (result.error._form as string[])[0]
              : "Error al completar la venta"
          sileo.error({ title: msg })
          return
        }
        const snap = buildReceiptSnapshot(result.data!.sale_number)
        setSaleResult({ sale_number: result.data!.sale_number })
        setReceiptSnapshot(snap)
        sileo.success({ title: `Venta ${result.data!.sale_number} completada`, description: "La venta fue registrada y el inventario actualizado" })
      } else {
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
          const msg =
            "_form" in result.error
              ? (result.error._form as string[])[0]
              : "Error al crear la venta"
          sileo.error({ title: msg })
          return
        }
        const snap = buildReceiptSnapshot(result.data!.sale_number)
        setSaleResult({ sale_number: result.data!.sale_number })
        setReceiptSnapshot(snap)
        sileo.success({ title: `Venta ${result.data!.sale_number} completada`, description: "La venta fue registrada y el inventario actualizado" })
        clear()
      }
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["pos"] })
      queryClient.invalidateQueries({ queryKey: ["pending-sales"] })
    } catch {
      sileo.error({ title: "Error de conexion", description: "No se pudo conectar con el servidor. Intenta de nuevo." })
    }
  }, [mode, pendingSale, items, customer, globalDiscount, notes, payments, clear, queryClient, isOnline, buildReceiptSnapshot])

  // ── Pending sale ──

  const handlePendingSale = useCallback(async () => {
    if (!isOnline) {
      sileo.error({ title: "Sin conexion", description: "Revisa tu conexion a internet e intenta de nuevo." })
      return
    }
    try {
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
        const msg =
          "_form" in result.error
            ? (result.error._form as string[])[0]
            : "Error al guardar venta pendiente"
        sileo.error({ title: msg })
        return
      }
      setWasPending(true)
      const snap = buildReceiptSnapshot(result.data!.sale_number)
      setSaleResult({ sale_number: result.data!.sale_number })
      setReceiptSnapshot(snap)
      sileo.success({ title: "Venta guardada como pendiente", description: "Recuerda cobrar esta venta desde la seccion de ventas pendientes." })
      clear()
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["pending-sales"] })
      queryClient.invalidateQueries({ queryKey: ["pos"] })
    } catch {
      sileo.error({ title: "Error de conexion", description: "No se pudo conectar con el servidor. Intenta de nuevo." })
    }
  }, [items, customer, globalDiscount, notes, clear, queryClient, isOnline, buildReceiptSnapshot])

  // ── Create vale ──

  const handleCreateVale = useCallback(async (paymentStatus: "paid" | "pending") => {
    if (!isOnline) {
      sileo.error({ title: "Sin conexion", description: "Revisa tu conexion a internet e intenta de nuevo." })
      return
    }
    if (!customer) {
      sileo.error({ title: "Se requiere un cliente para crear un vale" })
      return
    }
    try {
      const saleItems = items.map((item) => ({
        product_variant_id: item.variantId,
        product_name: item.productName,
        variant_label: item.variantLabel,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        unit_cost: item.unitCost,
        discount: item.discount,
      }))
      const result = await createVale({
        customer_id: customer.id,
        items: saleItems,
        payment_status: paymentStatus,
        discount_amount: globalDiscount,
        notes: notes || null,
      })
      if (result.error) {
        const msg =
          "_form" in result.error
            ? (result.error._form as string[])[0]
            : "Error al crear el vale"
        sileo.error({ title: msg })
        return
      }
      const snap = buildReceiptSnapshot(result.data!.vale_number)
      setSaleResult({ sale_number: result.data!.vale_number })
      setReceiptSnapshot(snap)
      sileo.success({
        title: `Vale ${result.data!.vale_number} creado`,
        description: paymentStatus === "paid"
          ? "El cliente ya pago. Entregar cuando haya stock."
          : "Cobrar al cliente cuando recoja el producto.",
      })
      clear()
      queryClient.invalidateQueries({ queryKey: ["vales"] })
      queryClient.invalidateQueries({ queryKey: ["vales-ready"] })
      queryClient.invalidateQueries({ queryKey: ["pos"] })
    } catch {
      sileo.error({ title: "Error de conexion", description: "No se pudo conectar con el servidor. Intenta de nuevo." })
    }
  }, [items, customer, globalDiscount, notes, clear, queryClient, isOnline, buildReceiptSnapshot])

  // ── Split sale (in-stock → sale, out-of-stock → vale) ──

  const handleSplitSale = useCallback(async (valePaymentStatus: "paid" | "pending") => {
    if (!isOnline) {
      sileo.error({ title: "Sin conexion", description: "Revisa tu conexion a internet e intenta de nuevo." })
      return
    }
    if (!customer) {
      sileo.error({ title: "Se requiere un cliente para crear un vale" })
      return
    }

    // Categorize items with bundle awareness (same logic as confirmation step)
    const inStockItems: typeof items = []
    const outOfStockItems: typeof items = []
    const skipComponents: string[] = []

    for (const item of items) {
      if (item.isBundle && item.bundleComponents?.length) {
        const oosComponents = item.bundleComponents.filter((c) => c.stock === 0)
        const inStockComponents = item.bundleComponents.filter((c) => c.stock > 0)

        if (oosComponents.length === 0) {
          inStockItems.push(item)
        } else if (inStockComponents.length === 0) {
          outOfStockItems.push(item)
        } else {
          // Partial OOS: cofre to sale, OOS components to vale
          inStockItems.push(item)
          for (const comp of oosComponents) {
            skipComponents.push(comp.variantId)
            outOfStockItems.push({
              variantId: comp.variantId,
              productId: item.productId,
              productName: `${comp.productName} (cofre)`,
              variantLabel: comp.variantLabel,
              sku: null,
              quantity: item.quantity,
              basePrice: 0,
              unitPrice: 0,
              unitCost: 0,
              discount: 0,
              stock: 0,
            })
          }
        }
      } else {
        if (item.stock > 0) inStockItems.push(item)
        else outOfStockItems.push(item)
      }
    }

    if (inStockItems.length === 0 || outOfStockItems.length === 0) return

    try {
      // 1. Create sale for in-stock items (bundles deduct components via RPC)
      const saleItems = inStockItems.map((item) => ({
        product_variant_id: item.variantId,
        product_name: item.productName,
        variant_label: item.variantLabel,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        unit_cost: item.unitCost,
        discount: item.discount,
      }))

      const saleSubtotal = inStockItems.reduce(
        (sum, i) => sum + i.unitPrice * i.quantity, 0
      )
      const saleItemsDiscount = inStockItems.reduce(
        (sum, i) => sum + i.discount, 0
      )
      const saleTotal = Math.max(0, saleSubtotal - saleItemsDiscount)

      // Adjust payments to cover only the sale total
      const adjustedPayments = payments.map((p, idx) => {
        if (idx === 0) return { method: p.method, amount: Math.min(p.amount, saleTotal), reference: p.reference ?? null }
        return { method: p.method, amount: p.amount, reference: p.reference ?? null }
      })
      const paymentSum = adjustedPayments.reduce((s, p) => s + p.amount, 0)
      if (paymentSum < saleTotal && adjustedPayments.length > 0) {
        adjustedPayments[0].amount += saleTotal - paymentSum
      }

      const saleResult = await createSale({
        customer_id: customer.id,
        items: saleItems,
        payments: adjustedPayments.filter((p) => p.amount > 0),
        discount_amount: 0,
        notes: notes || null,
        skip_components: skipComponents.length > 0 ? skipComponents : undefined,
      })

      if (saleResult.error) {
        const msg =
          "_form" in saleResult.error
            ? (saleResult.error._form as string[])[0]
            : "Error al crear la venta"
        sileo.error({ title: msg })
        return
      }

      // 2. Create vale for out-of-stock items (includes OOS bundle components at $0)
      const valeItems = outOfStockItems.map((item) => ({
        product_variant_id: item.variantId,
        product_name: item.productName,
        variant_label: item.variantLabel,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        unit_cost: item.unitCost,
        discount: item.discount,
      }))

      const valeResult = await createVale({
        customer_id: customer.id,
        items: valeItems,
        payment_status: valePaymentStatus,
        discount_amount: 0,
        notes: notes ? `Separado de venta ${saleResult.data!.sale_number}` : null,
      })

      if (valeResult.error) {
        const msg =
          "_form" in valeResult.error
            ? (valeResult.error._form as string[])[0]
            : "Error al crear el vale"
        sileo.error({ title: `Venta creada pero error en vale: ${msg}` })
        const snap = buildReceiptSnapshot(saleResult.data!.sale_number)
        setSaleResult({ sale_number: saleResult.data!.sale_number })
        setReceiptSnapshot(snap)
        clear()
        return
      }

      const combinedNumber = `${saleResult.data!.sale_number} + ${valeResult.data!.vale_number}`
      const snap = buildReceiptSnapshot(combinedNumber)
      setSaleResult({ sale_number: combinedNumber })
      setReceiptSnapshot(snap)
      sileo.success({
        title: "Venta y vale creados",
        description: `Venta ${saleResult.data!.sale_number} completada. Vale ${valeResult.data!.vale_number} ${valePaymentStatus === "paid" ? "pagado" : "pendiente de pago"}.`,
      })
      clear()
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["pos"] })
      queryClient.invalidateQueries({ queryKey: ["vales"] })
      queryClient.invalidateQueries({ queryKey: ["vales-ready"] })
      queryClient.invalidateQueries({ queryKey: ["pending-sales"] })
    } catch {
      sileo.error({ title: "Error de conexion", description: "No se pudo conectar con el servidor. Intenta de nuevo." })
    }
  }, [items, customer, payments, notes, globalDiscount, clear, queryClient, isOnline, buildReceiptSnapshot])

  // ── Print (uses snapshot captured before store clear) ──

  const handlePrint = useCallback(() => {
    if (!receiptSnapshot || !onPrint) return
    try {
      onPrint(receiptSnapshot)
      sileo.success({ title: "Recibo enviado a impresion", description: "El recibo se abrio en la ventana de impresion" })
    } catch {
      sileo.error({ title: "Error al imprimir", description: "No se pudo abrir la ventana de impresion" })
    }
  }, [onPrint, receiptSnapshot])

  // ── Close & reset ──

  const handleClose = useCallback(() => {
    setStepIndex(0)
    setPayments([])
    setSaleResult(null)
    setReceiptSnapshot(null)
    setWasPending(false)
    onClose()
  }, [onClose])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] w-[95vw] flex-col gap-0 overflow-hidden bg-neutral-50 p-0 sm:max-w-6xl sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">
          {mode === "complete-pending"
            ? "Completar venta pendiente"
            : mode === "new-sale"
              ? "Nueva venta"
              : "Cobrar"}
        </DialogTitle>

        {/* ── Header: step progress + close ── */}
        {!saleResult && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-100 bg-white px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:px-8">
            <nav className="flex items-center">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => index < stepIndex && setStepIndex(index)}
                    disabled={index >= stepIndex}
                    className={cn(
                      "flex items-center gap-2.5 transition-opacity",
                      index < stepIndex
                        ? "cursor-pointer opacity-100 hover:opacity-80"
                        : "cursor-default"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                        index < stepIndex
                          ? "bg-teal-500 text-white"
                          : index === stepIndex
                            ? "bg-accent-500 text-white"
                            : "bg-neutral-100 text-neutral-400"
                      )}
                    >
                      {index < stepIndex ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "hidden text-sm font-semibold sm:inline",
                        index === stepIndex
                          ? "text-neutral-800"
                          : index < stepIndex
                            ? "text-teal-600"
                            : "text-neutral-400"
                      )}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "mx-3 h-px w-6 rounded-full sm:mx-5 sm:w-10",
                        index < stepIndex ? "bg-teal-400" : "bg-neutral-200"
                      )}
                    />
                  )}
                </div>
              ))}
            </nav>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* ── Step content ── */}
        <div className="min-h-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep + (saleResult ? "-done" : "")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {currentStep === "customer" && (
                <WizardCustomerStep onNext={goNext} />
              )}
              {currentStep === "products" && (
                <WizardProductsStep onNext={goNext} onBack={goBack} />
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
                  onCreateVale={handleCreateVale}
                  onSplitSale={handleSplitSale}
                  onPrint={handlePrint}
                  onBack={goBack}
                  onClose={handleClose}
                  saleResult={saleResult}
                  receiptSnapshot={receiptSnapshot}
                  pendingSale={mode === "complete-pending" && pendingSale ? { subtotal: pendingSale.subtotal, discount_amount: pendingSale.discount_amount, total: pendingSale.total } : null}
                  wasPending={wasPending}
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
