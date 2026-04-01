"use client"

import Link from "next/link"
import { Clock, ArrowRight } from "lucide-react"
import { motion } from "motion/react"
import { formatCurrency } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { usePendingSales } from "../queries"
import type { PendingSaleWithSummary } from "../types"

interface POSPendingSalesProps {
  onComplete: (sale: PendingSaleWithSummary) => void
}

export function POSPendingSales({ onComplete }: POSPendingSalesProps) {
  const { data: pendingSales } = usePendingSales()

  if (!pendingSales || pendingSales.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 shadow-sm shadow-amber-500/[0.04]"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[1.5px] text-amber-600">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          Pendientes
          <span className="rounded-full bg-amber-200/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
            {pendingSales.length}
          </span>
        </h2>
        <Link
          href="/ventas?status=pending"
          className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 transition-colors hover:text-amber-800"
        >
          Ver todas
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {pendingSales.map((sale) => (
          <div
            key={sale.id}
            className="min-w-[240px] flex-shrink-0 rounded-xl border border-amber-100 bg-white p-3.5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-neutral-800">
                  {sale.sale_number}
                  {sale.customer ? ` — ${sale.customer.name}` : ""}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-neutral-400">
                  {sale.items.length} producto
                  {sale.items.length !== 1 ? "s" : ""} ·{" "}
                  {formatDistanceToNow(new Date(sale.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              <p className="flex-shrink-0 text-sm font-extrabold tabular-nums text-rose-600">
                {formatCurrency(sale.total)}
              </p>
            </div>
            <button
              onClick={() => onComplete(sale)}
              className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-amber-100 text-[11px] font-bold text-amber-700 transition-colors hover:bg-amber-200 active:scale-[0.98]"
            >
              Completar pago
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
