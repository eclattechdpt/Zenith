"use client"

import {
  ShoppingBag,
  RotateCcw,
  Ticket,
  FileText,
  Download,
  XCircle,
  Clock,
  CheckCircle2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ActivityItem {
  id: string
  tipo: string
  descripcion: string
  detalle: string
  monto: number | null
  hora: string
}

const iconMap: Record<string, LucideIcon> = {
  venta: ShoppingBag,
  devolucion: RotateCcw,
  vale: Ticket,
  vale_completado: CheckCircle2,
  nota_credito: FileText,
  nota_liquidada: CheckCircle2,
  exportacion: Download,
  cancelacion: XCircle,
  pendiente: Clock,
}

const styleMap: Record<string, { bg: string; color: string }> = {
  venta: { bg: "bg-neutral-100", color: "text-neutral-600" },
  devolucion: { bg: "bg-amber-50", color: "text-amber-600" },
  vale: { bg: "bg-indigo-50", color: "text-indigo-500" },
  vale_completado: { bg: "bg-emerald-50", color: "text-emerald-600" },
  nota_credito: { bg: "bg-teal-50", color: "text-teal-600" },
  nota_liquidada: { bg: "bg-emerald-50", color: "text-emerald-600" },
  exportacion: { bg: "bg-violet-50", color: "text-violet-500" },
  cancelacion: { bg: "bg-rose-50", color: "text-rose-500" },
  pendiente: { bg: "bg-amber-50", color: "text-amber-500" },
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-0.5">
      {items.slice(0, 4).map((item) => {
        const Icon = iconMap[item.tipo] ?? ShoppingBag
        const styles = styleMap[item.tipo] ?? styleMap.venta
        const isNegative = item.monto !== null && item.monto < 0
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl px-3 py-3"
          >
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${styles.bg}`}
            >
              <Icon
                className={`size-4 ${styles.color}`}
                strokeWidth={1.75}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-800">
                {item.descripcion}
              </p>
              <p className="truncate text-[11px] text-neutral-500">
                {item.detalle}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {item.monto !== null ? (
                <span
                  className={`text-[13px] font-bold tabular-nums ${
                    isNegative ? "text-rose-500" : "text-neutral-900"
                  }`}
                >
                  {isNegative ? "-" : ""}
                  {formatCurrency(Math.abs(item.monto))}
                </span>
              ) : (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                  exportado
                </span>
              )}
              <p className="text-[10px] text-neutral-400">{item.hora}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
