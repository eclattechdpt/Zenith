"use client"

import { useMemo } from "react"
import { motion } from "motion/react"
import {
  Ticket,
  User,
  CalendarDays,
  Package,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { VALE_STATUSES, VALE_PAYMENT_STATUSES } from "@/lib/constants"

import { useValeDetail } from "../queries"

// ── Status badge colors ──

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
}

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
}

// ── Component ──

interface ValeDetailModalProps {
  valeId: string | null
  open: boolean
  onClose: () => void
}

export function ValeDetailModal({ valeId, open, onClose }: ValeDetailModalProps) {
  const { data: vale, isLoading } = useValeDetail(open ? valeId : null)

  const dateFormatted = useMemo(() => {
    if (!vale) return ""
    return format(new Date(vale.created_at), "dd 'de' MMMM, yyyy — HH:mm", { locale: es })
  }, [vale])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalle de vale</DialogTitle>
          <DialogDescription>Informacion del vale</DialogDescription>
        </DialogHeader>

        {isLoading || !vale ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-accent-200 border-t-accent-500" />
          </div>
        ) : (
          <div className="flex flex-col max-h-[85vh] overflow-y-auto">
            {/* ── Header ── */}
            <div className="px-6 pt-8 pb-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {dateFormatted}
              </div>
              <div className="mt-1 flex items-center gap-2.5">
                <h2 className="font-display text-[28px] font-semibold leading-none tracking-[-1.5px] text-neutral-950">
                  {vale.vale_number}
                </h2>
                <Badge variant="outline" className={STATUS_COLORS[vale.status] ?? ""}>
                  {VALE_STATUSES[vale.status as keyof typeof VALE_STATUSES] ?? vale.status}
                </Badge>
                <Badge variant="outline" className={PAYMENT_COLORS[vale.payment_status] ?? ""}>
                  {VALE_PAYMENT_STATUSES[vale.payment_status as keyof typeof VALE_PAYMENT_STATUSES] ?? vale.payment_status}
                </Badge>
              </div>
              {vale.customers?.name && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                  <User className="size-3.5" />
                  {vale.customers.name}
                </div>
              )}
            </div>

            {/* ── KPI strip ── */}
            <div className="mx-6 grid grid-cols-3 gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total</p>
                <p className="mt-0.5 text-base font-bold text-neutral-900 tabular-nums">{formatCurrency(Number(vale.total))}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Productos</p>
                <p className="mt-0.5 text-base font-bold text-neutral-900 tabular-nums">{vale.vale_items.length}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Unidades</p>
                <p className="mt-0.5 text-base font-bold text-neutral-900 tabular-nums">
                  {vale.vale_items.reduce((sum, i) => sum + i.quantity, 0)}
                </p>
              </div>
            </div>

            {/* ── Items ── */}
            <div className="mt-4 px-6 pb-2">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-400">
                <Package className="size-3.5" />
                Productos
              </h3>
            </div>

            <div className="px-6 pb-6 space-y-1">
              {vale.vale_items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-xl bg-neutral-50/80 px-3 py-2.5"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                    <Ticket className="size-3.5 text-indigo-500" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-neutral-800">
                      {item.product_name}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {item.variant_label !== item.product_name ? `${item.variant_label} · ` : ""}
                      {item.quantity} x {formatCurrency(Number(item.unit_price))}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[13px] font-bold tabular-nums text-neutral-900">
                      {formatCurrency(Number(item.line_total))}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Discount + Total */}
              {Number(vale.discount_amount) > 0 && (
                <div className="flex justify-between px-3 pt-2 text-sm text-rose-500">
                  <span>Descuento</span>
                  <span className="tabular-nums">-{formatCurrency(Number(vale.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between rounded-xl bg-indigo-50 px-4 py-3 mt-2">
                <span className="text-sm font-bold text-neutral-800">Total</span>
                <span className="text-lg font-bold tabular-nums text-neutral-900">{formatCurrency(Number(vale.total))}</span>
              </div>
            </div>

            {/* ── Notes ── */}
            {vale.notes && (
              <div className="mx-6 mb-6 rounded-xl bg-neutral-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Notas</p>
                <p className="text-sm text-neutral-600">{vale.notes}</p>
              </div>
            )}

            {/* ── Completed date ── */}
            {vale.completed_at && (
              <div className="mx-6 mb-6 text-center text-[11px] text-neutral-400">
                Entregado el {format(new Date(vale.completed_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
