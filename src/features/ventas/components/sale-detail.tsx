"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  ArrowLeft,
  ArrowRightLeft,
  RotateCcw,
  XCircle,
  FileText,
  PackageCheck,
  PackageX,
  Printer,
  MoreVertical,
  Receipt,
  ShoppingBag,
  Banknote,
  CreditCard,
  CalendarDays,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { sileo } from "sileo"
import { useQueryClient } from "@tanstack/react-query"
import { useReactToPrint } from "react-to-print"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { SectionCard } from "@/components/shared/section-card"
import { KpiCard } from "@/components/shared/kpi-card"
import { formatCurrency } from "@/lib/utils"
import {
  SALE_STATUSES,
  PAYMENT_METHODS,
  CREDIT_NOTE_STATUSES,
} from "@/lib/constants"

import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

import { useSaleDetail } from "../queries"
import { cancelSale } from "../actions"
import { ReturnDialog } from "./return-dialog"
import { SaleDetailFixture } from "./fixtures/sale-detail-fixture"
import { SaleReceipt } from "@/features/pos/components/sale-receipt"
import type { ReceiptData } from "@/features/pos/components/sale-receipt"

// ── Status badge colors ──

const STATUS_COLORS: Record<string, string> = {
  quote: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
  partially_returned: "bg-amber-50 text-amber-700 border-amber-200",
  fully_returned: "bg-rose-50 text-rose-700 border-rose-200",
}

// ── Animation variants ──

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

// ── Helpers ──

const METHOD_SHORT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transfer.",
  credit_note: "Nota NC",
  other: "Otro",
}

function getPaymentSummaryLabel(
  payments: { method: string; amount: number }[]
): string {
  if (payments.length === 0) return "—"
  if (payments.length === 1) {
    return (
      METHOD_SHORT_LABELS[payments[0].method] ??
      PAYMENT_METHODS[payments[0].method as keyof typeof PAYMENT_METHODS] ??
      payments[0].method
    )
  }
  return "Mixto"
}

const METHOD_STYLE: Record<string, { icon: typeof Banknote; iconBg: string; iconColor: string; cardBg: string; cardBorder: string; innerBg: string; labelColor: string }> = {
  cash: { icon: Banknote, iconBg: "bg-emerald-50", iconColor: "text-emerald-500", cardBg: "bg-emerald-50/40", cardBorder: "border-emerald-200/60", innerBg: "bg-emerald-50/60", labelColor: "text-emerald-600" },
  card: { icon: CreditCard, iconBg: "bg-blue-50", iconColor: "text-blue-500", cardBg: "bg-blue-50/40", cardBorder: "border-blue-200/60", innerBg: "bg-blue-50/60", labelColor: "text-blue-600" },
  transfer: { icon: ArrowRightLeft, iconBg: "bg-violet-50", iconColor: "text-violet-500", cardBg: "bg-violet-50/40", cardBorder: "border-violet-200/60", innerBg: "bg-violet-50/60", labelColor: "text-violet-600" },
  credit_note: { icon: FileText, iconBg: "bg-amber-50", iconColor: "text-amber-500", cardBg: "bg-amber-50/40", cardBorder: "border-amber-200/60", innerBg: "bg-amber-50/60", labelColor: "text-amber-600" },
}

const MIXED_STYLE = { icon: CreditCard, iconBg: "bg-neutral-100", iconColor: "text-neutral-500", cardBg: "", cardBorder: "", innerBg: "bg-neutral-50", labelColor: "text-neutral-600" }

function getPaymentStyle(payments: { method: string }[]) {
  if (payments.length === 0) return MIXED_STYLE
  if (payments.length > 1) return MIXED_STYLE
  return METHOD_STYLE[payments[0].method] ?? MIXED_STYLE
}

// ── Component ──

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

  // ── Print ──

  const receiptRef = useRef<HTMLDivElement>(null)

  const receiptData = useMemo<ReceiptData | null>(() => {
    if (!sale) return null
    const paymentTotal = sale.sale_payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )
    return {
      saleNumber: sale.sale_number,
      date: sale.created_at,
      customerName: sale.customers?.name ?? null,
      items: sale.sale_items.map((item) => ({
        product_name: item.product_name,
        variant_label: item.variant_label,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        discount: Number(item.discount),
        line_total: Number(item.line_total),
      })),
      payments: sale.sale_payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount),
      })),
      subtotal: Number(sale.subtotal),
      discountAmount: Number(sale.discount_amount),
      total: Number(sale.total),
      change: Math.max(0, paymentTotal - Number(sale.total)),
    }
  }, [sale])

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receiptData
      ? `Recibo-${receiptData.saleNumber}`
      : "Recibo",
  })

  const triggerPrint = useCallback(() => {
    if (!receiptData) return
    setTimeout(() => handlePrint(), 150)
  }, [receiptData, handlePrint])

  // ── Actions ──

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
      sileo.error({ title: msg })
      return
    }

    sileo.success({ title: "Venta cancelada", description: "El stock fue restaurado al inventario" })
    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
  }

  // ── Loading / Not found ──

  if (!isLoading && !sale) {
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

  // ── Derived values (safe during loading — skeleton is shown instead) ──

  const dateFormatted = sale
    ? format(new Date(sale.created_at), "EEEE, d 'de' MMMM", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())
    : ""

  const timeFormatted = sale
    ? format(new Date(sale.created_at), "HH:mm", { locale: es })
    : ""

  const itemCount = sale ? sale.sale_items.reduce((sum, i) => sum + i.quantity, 0) : 0
  const paymentStyle = getPaymentStyle(sale?.sale_payments ?? [])
  const paymentLabel = getPaymentSummaryLabel(sale?.sale_payments ?? [])
  const showActions = isReturnable || canCancel

  return (
    <>
      <BoneyardSkeleton
        name="sale-detail"
        loading={isLoading || !sale}
        animate="shimmer"
        fixture={<SaleDetailFixture />}
      >
      {sale && <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto flex w-full max-w-4xl flex-col gap-6 pt-10"
      >
        {/* ── Header ── */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 pl-10 sm:pl-0">
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 shrink-0"
                onClick={() => router.push("/ventas")}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dateFormatted}
                </p>
                <div className="mt-1 flex items-center gap-2.5">
                  <h1 className="font-display text-[32px] font-semibold leading-none tracking-[-1.5px] text-neutral-950 sm:text-[40px]">
                    {sale.sale_number}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${STATUS_COLORS[status!] ?? ""}`}
                  >
                    {SALE_STATUSES[status as keyof typeof SALE_STATUSES] ??
                      status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {timeFormatted} hrs
                  {sale.customers && (
                    <span className="ml-2 font-medium text-teal-600">
                      {sale.customers.name}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pl-10 sm:pl-0">
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  className="group h-10 gap-2 rounded-xl bg-accent-500 px-5 text-sm font-bold text-white transition-colors hover:bg-accent-600 sm:h-11 sm:px-6"
                  onClick={triggerPrint}
                >
                  <Printer className="size-4" />
                  Imprimir ticket
                </Button>
              </motion.div>

              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex size-10 items-center justify-center rounded-xl border border-input bg-background text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isReturnable && (
                      <DropdownMenuItem
                        onClick={() => setShowReturnDialog(true)}
                      >
                        <RotateCcw className="mr-2 size-4" />
                        Devolver
                      </DropdownMenuItem>
                    )}
                    {canCancel && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        <XCircle className="mr-2 size-4" />
                        Cancelar venta
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── KPI Strip ── */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-3"
        >
          <KpiCard
            title="Total"
            value={Number(sale.total)}
            format={formatCurrency}
            subtitle="Monto de la venta"
            icon={Receipt}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            delay={0}
          />
          <KpiCard
            title="Productos"
            value={itemCount}
            subtitle={`${itemCount === 1 ? "artículo" : "artículos"} · ${sale.sale_items.length} ${sale.sale_items.length === 1 ? "línea" : "líneas"}`}
            icon={ShoppingBag}
            iconBg="bg-blush-50"
            iconColor="text-blush-500"
            delay={0.06}
          />
          <KpiCard
            title="Método de pago"
            value={0}
            format={() => paymentLabel}
            subtitle={
              sale.sale_payments.length > 1
                ? `${sale.sale_payments.length} métodos`
                : "Pago único"
            }
            icon={paymentStyle.icon}
            iconBg={paymentStyle.iconBg}
            iconColor={paymentStyle.iconColor}
            delay={0.12}
          />
        </motion.div>

        {/* ── Items (receipt-inspired) ── */}
        <SectionCard
          label="Productos"
          icon={ShoppingBag}
          iconBg="bg-rose-50"
          iconColor="text-rose-400"
          delay={0.18}
        >
          {/* Table header */}
          <div className="mb-3 flex justify-between border-b border-neutral-200 pb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[1px] text-neutral-400">
              Producto
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[1px] text-neutral-400">
              Importe
            </span>
          </div>

          {/* Item rows */}
          <div className="space-y-0">
            {sale.sale_items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-4 py-3 ${
                  idx < sale.sale_items.length - 1
                    ? "border-b border-neutral-100"
                    : ""
                }`}
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
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {item.quantity} x{" "}
                    {formatCurrency(Number(item.unit_price))}
                  </p>
                  {Number(item.discount) > 0 && (
                    <p className="mt-0.5 text-xs text-rose-500">
                      Descuento −{formatCurrency(Number(item.discount))}
                    </p>
                  )}
                </div>
                <p className="text-sm font-semibold tabular-nums text-neutral-950">
                  {formatCurrency(Number(item.line_total))}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-1.5 border-t border-neutral-200 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="tabular-nums text-neutral-700">
                {formatCurrency(Number(sale.subtotal))}
              </span>
            </div>
            {Number(sale.discount_amount) > 0 && (
              <div className="flex justify-between text-sm text-rose-600">
                <span>Descuento</span>
                <span className="tabular-nums">
                  −{formatCurrency(Number(sale.discount_amount))}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-rose-50 to-rose-100/60 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-[1px] text-neutral-900">
                Total
              </span>
              <span className="font-display text-lg font-bold tabular-nums tracking-tight text-neutral-950">
                {formatCurrency(Number(sale.total))}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* ── Payments ── */}
        <SectionCard
          label="Forma de pago"
          icon={paymentStyle.icon}
          iconBg={paymentStyle.iconBg}
          iconColor={paymentStyle.iconColor}
          delay={0.24}
          className={paymentStyle.cardBg ? `${paymentStyle.cardBg} ${paymentStyle.cardBorder}` : ""}
        >
          <div className={`rounded-xl p-4 ${paymentStyle.innerBg}`}>
            <div className="space-y-2">
              {sale.sale_payments.map((p) => {
                const pStyle = METHOD_STYLE[p.method] ?? MIXED_STYLE
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className={pStyle.labelColor}>
                      {PAYMENT_METHODS[
                        p.method as keyof typeof PAYMENT_METHODS
                      ] ?? p.method}
                      {p.reference && (
                        <span className="ml-1.5 text-xs opacity-60">
                          ({p.reference})
                        </span>
                      )}
                    </span>
                    <span className="font-medium tabular-nums text-neutral-950">
                      {formatCurrency(Number(p.amount))}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Change */}
            {receiptData && receiptData.change > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 text-sm font-semibold text-teal-600">
                <span>Cambio</span>
                <span className="tabular-nums">
                  {formatCurrency(receiptData.change)}
                </span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Returns ── */}
        {sale.returns.length > 0 && (
          <SectionCard
            label="Devoluciones"
            icon={RotateCcw}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            delay={0.3}
            className="border-rose-100"
          >
            <div className="space-y-4">
              {sale.returns.map((ret) => (
                <div
                  key={ret.id}
                  className="rounded-xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/30 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">
                        {ret.return_number}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {format(
                          new Date(ret.created_at),
                          "dd MMM yyyy, HH:mm",
                          { locale: es }
                        )}
                      </p>
                      {ret.reason && (
                        <p className="mt-1 text-xs italic text-neutral-500">
                          {ret.reason}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold tabular-nums text-rose-600">
                      −{formatCurrency(Number(ret.total_refund))}
                    </p>
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

                  {/* Credit notes */}
                  {(ret.credit_notes ?? []).length > 0 && (
                    <div className="mt-3 border-t border-neutral-100 pt-3">
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
                              className="px-1 py-0 text-[9px]"
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
          </SectionCard>
        )}
      </motion.div>}
      </BoneyardSkeleton>

      {/* ── Hidden receipt for printing ── */}
      {receiptData && (
        <div className="hidden">
          <SaleReceipt ref={receiptRef} data={receiptData} />
        </div>
      )}

      {/* ── Dialogs ── */}
      <ReturnDialog
        saleId={showReturnDialog ? saleId : null}
        onOpenChange={(open) => !open && setShowReturnDialog(false)}
        onReturned={() => setShowReturnDialog(false)}
      />

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={(open) => !open && setShowCancelDialog(false)}
        title="Cancelar venta"
        description={`Se cancelara la venta "${sale?.sale_number}" y se regresara el stock al inventario. Esta accion no se puede deshacer.`}
        confirmLabel="Cancelar venta"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleCancelSale}
      />
    </>
  )
}
