"use client"

import { useState } from "react"
import {
  Check,
  Clock,
  Printer,
  Loader2,
  ArrowLeft,
  User,
  ShoppingBag,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Sparkles,
  Ticket,
} from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { PAYMENT_METHODS } from "@/lib/constants"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { usePOSStore } from "../store"
import type { CartPayment } from "../types"

const THIN_SCROLL =
  "[scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.08)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300/40"

const METHOD_ICON: Record<string, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRightLeft,
  credit_note: Banknote,
  other: Banknote,
}

interface WizardConfirmationStepProps {
  payments: CartPayment[]
  onCompleteSale: () => Promise<void>
  onPendingSale: () => Promise<void>
  onCreateVale: (paymentStatus: "paid" | "pending") => Promise<void>
  onPrint: () => void
  onBack: () => void
  onClose: () => void
  saleResult: { sale_number: string } | null
}

export function WizardConfirmationStep({
  payments,
  onCompleteSale,
  onPendingSale,
  onCreateVale,
  onPrint,
  onBack,
  onClose,
  saleResult,
}: WizardConfirmationStepProps) {
  const items = usePOSStore((s) => s.items)
  const customer = usePOSStore((s) => s.customer)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)

  const [submitting, setSubmitting] = useState<"complete" | "pending" | "vale-paid" | "vale-pending" | null>(
    null
  )
  const [confirmAction, setConfirmAction] = useState<
    "complete" | "pending" | "vale" | null
  >(null)

  const isOnline = useOnlineStatus()

  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const change = paymentTotal > getTotal() ? paymentTotal - getTotal() : 0

  const handleComplete = async () => {
    setConfirmAction(null)
    setSubmitting("complete")
    try {
      await onCompleteSale()
    } finally {
      setSubmitting(null)
    }
  }

  const handlePending = async () => {
    setConfirmAction(null)
    setSubmitting("pending")
    try {
      await onPendingSale()
    } finally {
      setSubmitting(null)
    }
  }

  const handleVale = async (paymentStatus: "paid" | "pending") => {
    setConfirmAction(null)
    setSubmitting(paymentStatus === "paid" ? "vale-paid" : "vale-pending")
    try {
      await onCreateVale(paymentStatus)
    } finally {
      setSubmitting(null)
    }
  }

  // ── Success state ──
  if (saleResult) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 bg-white px-8">
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-100"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: 0.15,
              }}
            >
              <Check className="h-12 w-12 text-teal-600" strokeWidth={2.5} />
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="h-6 w-6 text-amber-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="absolute -bottom-1 -left-3"
          >
            <Sparkles className="h-5 w-5 text-rose-300" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Venta completada
          </h2>
          <p className="mt-2 text-lg text-neutral-500">
            Folio:{" "}
            <span className="font-bold text-neutral-800">
              {saleResult.sale_number}
            </span>
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          type="button"
          onClick={onPrint}
          className="flex h-12 items-center gap-2.5 rounded-xl border-2 border-neutral-200 px-8 text-base font-bold text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98]"
        >
          <Printer className="h-5 w-5" /> Imprimir ticket
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          type="button"
          onClick={onClose}
          className="cursor-pointer text-sm font-semibold text-neutral-400 transition-colors hover:text-neutral-600"
        >
          Cerrar
        </motion.button>
      </div>
    )
  }

  // ── Confirmation view ──
  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white px-6 pt-8 pb-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Confirmar venta
          </h2>
          <p className="mt-1.5 text-base text-neutral-500">
            Revisa los detalles antes de confirmar
          </p>
        </div>

        {/* Content */}
        <div
          className={cn(
            "min-h-0 flex-1 space-y-5 overflow-y-auto bg-neutral-100/40 px-6 py-6 shadow-[inset_0_2px_6px_rgba(0,0,0,0.03)] sm:px-8",
            THIN_SCROLL
          )}
        >
          {/* Customer card */}
          {customer && (
            <div className="flex items-center gap-4 rounded-2xl bg-teal-50 p-5 shadow-sm shadow-teal-500/5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-200 text-teal-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-teal-500">
                  Cliente
                </p>
                <p className="text-base font-bold text-neutral-800">
                  {customer.name}
                </p>
              </div>
              {customer.discountPercent > 0 && (
                <span className="ml-auto rounded-full bg-teal-200/60 px-2.5 py-1 text-xs font-bold text-teal-700">
                  -{customer.discountPercent}%
                </span>
              )}
            </div>
          )}

          {/* Order details card */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm shadow-neutral-900/[0.02]">
            <div className="mb-5">
              <div className="mb-3 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-neutral-400" />
                <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-400">
                  Productos ({items.length})
                </p>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex items-center justify-between rounded-lg bg-neutral-50/60 px-3.5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-800">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {formatCurrency(item.unitPrice)} x {item.quantity}
                      </p>
                    </div>
                    <p className="flex-shrink-0 text-sm font-bold tabular-nums text-neutral-800">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-neutral-100" />

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold tabular-nums text-neutral-700">
                  {formatCurrency(getSubtotal())}
                </span>
              </div>
              {getItemsDiscount() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-teal-600">Descuento</span>
                  <span className="font-semibold tabular-nums text-teal-600">
                    -{formatCurrency(getItemsDiscount())}
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-neutral-100 pt-3">
                <span className="text-base font-bold text-neutral-800">
                  Total
                </span>
                <span className="text-2xl font-extrabold tabular-nums tracking-tight text-rose-600">
                  {formatCurrency(getTotal())}
                </span>
              </div>
            </div>
          </div>

          {/* Payments card */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm shadow-neutral-900/[0.02]">
            <div className="mb-3 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-neutral-400" />
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-400">
                Pagos
              </p>
            </div>
            <div className="space-y-2">
              {payments.map((p, i) => {
                const Icon = METHOD_ICON[p.method] ?? Banknote
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-neutral-50/60 px-3.5 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-700">
                        {PAYMENT_METHODS[p.method]}
                        {p.reference && (
                          <span className="ml-1 text-neutral-400">
                            ({p.reference})
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-neutral-800">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
            {change > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2.5">
                <span className="text-sm font-semibold text-teal-700">
                  Cambio
                </span>
                <span className="text-sm font-bold tabular-nums text-teal-700">
                  {formatCurrency(change)}
                </span>
              </div>
            )}
          </div>
        </div>

        {!isOnline && (
          <div className="flex-shrink-0 bg-amber-50 px-6 py-2 text-center text-xs font-semibold text-amber-700 sm:px-8">
            Sin conexion a internet — los botones se activaran cuando vuelvas a
            estar en linea
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center gap-3 border-t border-neutral-200/60 bg-white px-6 py-4 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] sm:px-8">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting !== null}
            className="flex h-12 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Atras
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction("pending")}
            disabled={submitting !== null || !isOnline}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-6 text-sm font-bold text-amber-700 transition-all hover:bg-amber-100 active:scale-[0.98] disabled:opacity-40"
          >
            {submitting === "pending" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            Confirmar despues
          </button>
          <button
            type="button"
            onClick={() => {
              if (!customer) {
                // Vale requires a customer
                return
              }
              setConfirmAction("vale")
            }}
            disabled={submitting !== null || !isOnline || !customer}
            title={!customer ? "Se requiere un cliente para crear un vale" : undefined}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-indigo-300 bg-indigo-50 px-6 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-100 active:scale-[0.98] disabled:opacity-40"
          >
            {submitting === "vale-paid" || submitting === "vale-pending" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Ticket className="h-4 w-4" />
            )}
            Vale
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction("complete")}
            disabled={submitting !== null || !isOnline}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-500 text-base font-bold text-white shadow-sm shadow-accent-500/20 transition-all hover:bg-accent-600 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            {submitting === "complete" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            Completar venta
          </button>
        </div>
      </div>

      {/* ── Confirmation dialogs ── */}
      <ConfirmDialog
        open={confirmAction === "complete"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Completar venta"
        description={`Se registrara la venta por ${formatCurrency(getTotal())} y se descontara el stock de los productos. Esta accion no se puede deshacer.`}
        confirmLabel="Completar venta"
        cancelLabel="Cancelar"
        isLoading={submitting === "complete"}
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={confirmAction === "pending"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Guardar como pendiente"
        description="La venta se guardara sin procesar el pago. Podras completarla mas tarde desde la seccion de ventas pendientes. No se descontara stock hasta que se complete."
        confirmLabel="Guardar pendiente"
        cancelLabel="Cancelar"
        isLoading={submitting === "pending"}
        onConfirm={handlePending}
      />

      {/* Vale dialog — asks paid or pending */}
      {confirmAction === "vale" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-neutral-900">
                Crear vale
              </h3>
            </div>
            <p className="mb-5 text-sm text-neutral-500">
              Se creara un vale para {customer?.name}. No se descontara stock
              hasta que el cliente recoja el producto.
            </p>
            <p className="mb-4 text-sm font-semibold text-neutral-700">
              El cliente ya pago?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleVale("pending")}
                disabled={submitting !== null}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 text-sm font-bold text-amber-700 transition-all hover:bg-amber-100 active:scale-[0.98] disabled:opacity-40"
              >
                {submitting === "vale-pending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                No, pendiente
              </button>
              <button
                type="button"
                onClick={() => handleVale("paid")}
                disabled={submitting !== null}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-40"
              >
                {submitting === "vale-paid" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Si, pagado
              </button>
            </div>
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              disabled={submitting !== null}
              className="mt-3 w-full text-center text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-600 disabled:opacity-40"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
