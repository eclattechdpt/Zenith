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
  ShoppingBag,
  CreditCard,
  Receipt,
  User,
  Calendar,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionCard } from "@/components/shared/section-card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatCurrency } from "@/lib/utils"
import {
  SALE_STATUSES,
  PAYMENT_METHODS,
  CREDIT_NOTE_STATUSES,
} from "@/lib/constants"

import { useSaleDetail } from "../queries"
import { cancelSale, cancelReturn } from "../actions"
import { ReturnDialog } from "./return-dialog"

const STATUS_COLORS: Record<string, string> = {
  quote: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
  partially_returned: "bg-amber-50 text-amber-700 border-amber-200",
  fully_returned: "bg-rose-50 text-rose-700 border-rose-200",
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
  const [cancelReturnTarget, setCancelReturnTarget] = useState<{
    id: string
    return_number: string
  } | null>(null)
  const [isCancellingReturn, setIsCancellingReturn] = useState(false)

  const status = sale?.status as string | undefined
  const isReturnable =
    status === "completed" || status === "partially_returned"
  const hasReturns = (sale?.returns ?? []).some(
    (r) => r.status === "completed"
  )
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

  async function handleCancelReturn() {
    if (!cancelReturnTarget) return
    setIsCancellingReturn(true)
    try {
      const result = await cancelReturn({ return_id: cancelReturnTarget.id })
      setIsCancellingReturn(false)
      setCancelReturnTarget(null)

      if ("error" in result) {
        const msg =
          (result.error as Record<string, string[]>)._form?.[0] ??
          "Error al cancelar la devolucion"
        toast.error(msg)
        return
      }

      toast.success("Devolucion cancelada")
      queryClient.invalidateQueries({ queryKey: ["sale-detail", saleId] })
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    } catch {
      setIsCancellingReturn(false)
      setCancelReturnTarget(null)
      toast.error("Error al cancelar la devolucion")
    }
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
    <div className="min-w-0 flex-1 space-y-6 p-5 sm:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="flex flex-col gap-4 pl-10 sm:pl-0"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/ventas")}
          className="w-fit -ml-2 text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Volver a ventas
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-950">
                {sale.sale_number}
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] ${STATUS_COLORS[status!] ?? ""}`}
              >
                {SALE_STATUSES[status as keyof typeof SALE_STATUSES] ?? status}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {format(new Date(sale.created_at), "dd 'de' MMMM, yyyy — HH:mm", {
                  locale: es,
                })}
              </span>
              {sale.customers && (
                <span className="flex items-center gap-1.5 text-teal-600 font-medium">
                  <User className="size-3.5" />
                  {sale.customers.name}
                </span>
              )}
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
        </div>
      </motion.div>

      {/* Items */}
      <SectionCard
        label="Productos"
        description={`${sale.sale_items.length} producto${sale.sale_items.length !== 1 ? "s" : ""} en esta venta`}
        icon={ShoppingBag}
        iconBg="bg-rose-50"
        iconColor="text-rose-400"
        delay={0.06}
      >
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
      </SectionCard>

      {/* Payments */}
      <SectionCard
        label="Pagos"
        description="Metodos de pago registrados"
        icon={CreditCard}
        iconBg="bg-teal-50"
        iconColor="text-teal-500"
        delay={0.12}
      >
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
      </SectionCard>

      {/* Returns history */}
      {sale.returns.length > 0 && (
        <SectionCard
          label="Devoluciones"
          description={`${sale.returns.length} devolucion${sale.returns.length !== 1 ? "es" : ""} registrada${sale.returns.length !== 1 ? "s" : ""}`}
          icon={RotateCcw}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          delay={0.18}
          className="border-rose-100 bg-gradient-to-b from-white to-rose-50/30"
        >
          <div className="space-y-4">
            {sale.returns.map((ret) => {
              const isCancelled = ret.status === "cancelled"
              return (
                <div
                  key={ret.id}
                  className={`rounded-xl border p-4 ${
                    isCancelled
                      ? "border-neutral-200 bg-neutral-50/50 opacity-60"
                      : "border-rose-100 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-neutral-950">
                          {ret.return_number}
                        </p>
                        {isCancelled && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-neutral-100 text-neutral-500 border-neutral-200"
                          >
                            Cancelada
                          </Badge>
                        )}
                      </div>
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
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold tabular-nums ${isCancelled ? "text-neutral-400 line-through" : "text-rose-600"}`}>
                        -{formatCurrency(Number(ret.total_refund))}
                      </p>
                      {ret.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-neutral-400 hover:text-red-600"
                          onClick={() =>
                            setCancelReturnTarget({
                              id: ret.id,
                              return_number: ret.return_number,
                            })
                          }
                        >
                          <XCircle className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Return items */}
                  <div className="space-y-1.5">
                    {(ret.return_items ?? []).map((ri) => (
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
                  {(ret.credit_notes ?? []).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      {(ret.credit_notes ?? []).map((cn) => (
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
              )
            })}
          </div>
        </SectionCard>
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

      {/* Cancel return confirmation */}
      <ConfirmDialog
        open={!!cancelReturnTarget}
        onOpenChange={(open) => !open && setCancelReturnTarget(null)}
        title="Cancelar devolucion"
        description={`Se cancelara la devolucion "${cancelReturnTarget?.return_number}" y se revertiran los movimientos de stock. Esta accion no se puede deshacer.`}
        confirmLabel="Cancelar devolucion"
        variant="destructive"
        isLoading={isCancellingReturn}
        onConfirm={handleCancelReturn}
      />
    </div>
  )
}
