"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
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
      className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-3"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
          <Clock className="h-4 w-4" />
          Ventas pendientes ({pendingSales.length})
        </h2>
        <Link href="/ventas?status=pending" className="text-xs text-amber-700 underline hover:text-amber-900">
          Ver todas →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {pendingSales.map((sale) => (
          <div key={sale.id} className="min-w-[220px] flex-shrink-0 rounded-lg border border-amber-200 bg-white p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-800">
                  {sale.sale_number}{sale.customer ? ` • ${sale.customer.name}` : ""}
                </p>
                <p className="text-[10px] text-stone-500">
                  {sale.items.length} producto{sale.items.length !== 1 ? "s" : ""} •{" "}
                  {formatDistanceToNow(new Date(sale.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>
              <p className="text-sm font-extrabold text-rose-600">{formatCurrency(sale.total)}</p>
            </div>
            <button
              onClick={() => onComplete(sale)}
              className="mt-2 w-full rounded-md bg-rose-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
            >
              Completar pago
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
