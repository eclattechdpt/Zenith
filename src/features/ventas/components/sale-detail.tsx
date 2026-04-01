"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  ArrowLeft,
  RotateCcw,
  XCircle,
  Loader2,
  FileText,
  PackageCheck,
  PackageX,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatCurrency } from "@/lib/utils"
import {
  SALE_STATUSES,
  PAYMENT_METHODS,
  CREDIT_NOTE_STATUSES,
} from "@/lib/constants"

import { useSaleDetail } from "../queries"
import { cancelSale } from "../actions"
import { ReturnDialog } from "./return-dialog"

const STATUS_COLORS: Record<string, string> = {
  quote: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
  partially_returned: "bg-amber-50 text-amber-700 border-amber-200",
  fully_returned: "bg-rose-50 text-rose-700 border-rose-200",
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

interface SaleDetailProps {
  saleId: string
}

export function SaleDetail({ saleId }: SaleDetailProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: sale, isLoading } = useSaleDetail(saleId)

  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const status = sale?.status as string | undefined
  const isReturnable =
    status === "completed" || status === "partially_returned"
  const hasReturns = (sale?.returns ?? []).length > 0
  const canCancel = status === "completed" && !hasReturns

  async function handleCancelSale() {
    if (!sale) return
    setIsCancelling(true)
    const result = await cancelSale({ sale_id: sale.id })
    setIsCancelling(false)
    setShowCancelDialog(false)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al cancelar"
      toast.error(msg)
      return
    }

    toast.success("Venta cancelada")
    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-neutral-300" />
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-neutral-500">Venta no encontrada</p>
        <Button variant="outline" onClick={() => router.push("/ventas")}>
          <ArrowLeft className="mr-1.5 size-4" />
          Volver
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 pl-12 sm:pl-0 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/ventas")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
                {sale.sale_number}
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] ${STATUS_COLORS[status!] ?? ""}`}
              >
                {SALE_STATUSES[status as keyof typeof SALE_STATUSES] ?? status}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500">
              {format(new Date(sale.created_at), "dd 'de' MMMM, yyyy — HH:mm", {
                locale: es,
              })}
              {sale.customers && (
                <span className="text-teal-600 ml-2">
                  {sale.customers.name}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isReturnable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReturnDialog(true)}
            >
              <RotateCcw className="mr-1.5 size-4" />
              Devolver
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="mr-1.5 size-4" />
              Cancelar venta
            </Button>
          )}
        </div>
      </motion.div>

      {/* Items */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-neutral-100 bg-white p-4 sm:p-6"
      >
        <h2 className="text-sm font-semibold text-neutral-950 mb-4">
          Productos
        </h2>
        <div className="space-y-3">
          {sale.sale_items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  {item.product_name}
                </p>
                {item.variant_label !== item.product_name && (
                  <p className="text-xs text-neutral-500">
                    {item.variant_label}
                  </p>
                )}
                <p className="text-xs text-neutral-400">
                  {item.quantity} x {formatCurrency(Number(item.unit_price))}
                  {Number(item.discount) > 0 && (
                    <span className="text-rose-500 ml-1">
                      -{formatCurrency(Number(item.discount))}
                    </span>
                  )}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-950 tabular-nums">
                {formatCurrency(Number(item.line_total))}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1">
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Subtotal</span>
            <span className="tabular-nums">
              {formatCurrency(Number(sale.subtotal))}
            </span>
          </div>
          {Number(sale.discount_amount) > 0 && (
            <div className="flex justify-between text-sm text-rose-600">
              <span>Descuento</span>
              <span className="tabular-nums">
                -{formatCurrency(Number(sale.discount_amount))}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-neutral-950">
            <span>Total</span>
            <span className="tabular-nums">
              {formatCurrency(Number(sale.total))}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Payments */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-neutral-100 bg-white p-4 sm:p-6"
      >
        <h2 className="text-sm font-semibold text-neutral-950 mb-4">
          Pagos
        </h2>
        <div className="space-y-2">
          {sale.sale_payments.map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span className="text-neutral-600">
                {PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ??
                  p.method}
                {p.reference && (
                  <span className="text-neutral-400 ml-1 text-xs">
                    ({p.reference})
                  </span>
                )}
              </span>
              <span className="font-medium text-neutral-950 tabular-nums">
                {formatCurrency(Number(p.amount))}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Returns history */}
      {sale.returns.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/30 p-4 sm:p-6"
        >
          <h2 className="text-sm font-semibold text-neutral-950 mb-4 flex items-center gap-2">
            <RotateCcw className="size-4 text-rose-500" />
            Devoluciones
          </h2>
          <div className="space-y-4">
            {sale.returns.map((ret) => (
              <div
                key={ret.id}
                className="rounded-xl border border-rose-100 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">
                      {ret.return_number}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {format(new Date(ret.created_at), "dd MMM yyyy, HH:mm", {
                        locale: es,
                      })}
                    </p>
                    {ret.reason && (
                      <p className="text-xs text-neutral-500 mt-1 italic">
                        {ret.reason}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-rose-600 tabular-nums">
                    -{formatCurrency(Number(ret.total_refund))}
                  </p>
                </div>

                {/* Return items */}
                <div className="space-y-1.5">
                  {ret.return_items.map((ri) => (
                    <div
                      key={ri.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        {ri.restock ? (
                          <PackageCheck className="size-3 text-emerald-500" />
                        ) : (
                          <PackageX className="size-3 text-neutral-400" />
                        )}
                        <span>
                          {ri.quantity}x —{" "}
                          {formatCurrency(Number(ri.unit_price))} c/u
                        </span>
                      </div>
                      <span className="tabular-nums text-neutral-500">
                        {formatCurrency(Number(ri.line_total))}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Credit notes from this return */}
                {ret.credit_notes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    {ret.credit_notes.map((cn) => (
                      <div
                        key={cn.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <FileText className="size-3 text-teal-500" />
                          <span className="font-medium text-teal-700">
                            {cn.credit_number}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1"
                          >
                            {CREDIT_NOTE_STATUSES[
                              cn.status as keyof typeof CREDIT_NOTE_STATUSES
                            ] ?? cn.status}
                          </Badge>
                        </div>
                        <span className="tabular-nums text-neutral-600">
                          {formatCurrency(Number(cn.remaining_amount))} /{" "}
                          {formatCurrency(Number(cn.original_amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Return dialog */}
      <ReturnDialog
        saleId={showReturnDialog ? saleId : null}
        onOpenChange={(open) => !open && setShowReturnDialog(false)}
        onReturned={() => setShowReturnDialog(false)}
      />

      {/* Cancel sale confirmation */}
      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={(open) => !open && setShowCancelDialog(false)}
        title="Cancelar venta"
        description={`Se cancelara la venta "${sale.sale_number}" y se regresara el stock al inventario. Esta accion no se puede deshacer.`}
        confirmLabel="Cancelar venta"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleCancelSale}
      />
    </motion.div>
  )
}
