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

export const activityIconMap: Record<string, LucideIcon> = {
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

export const activityStyleMap: Record<
  string,
  { bg: string; color: string }
> = {
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

const iconMap = activityIconMap
const styleMap = activityStyleMap

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-3.5">
      {items.map((item) => {
        const Icon = iconMap[item.tipo] ?? ShoppingBag
        const styles = styleMap[item.tipo] ?? styleMap.venta
        const isNegative = item.monto !== null && item.monto < 0

        return (
          <div key={item.id} className="flex items-center gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${styles.bg}`}
            >
              <Icon
                className={`size-[17px] ${styles.color}`}
                strokeWidth={1.75}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-900">
                {item.descripcion}
              </p>
              <p className="truncate text-[11px] text-neutral-500">
                <span className="truncate">{item.detalle}</span>
                <span className="mx-1.5 text-accent-500">•</span>
                <span className="text-neutral-400">{item.hora}</span>
              </p>
            </div>

            <div className="shrink-0">
              {item.monto !== null ? (
                <span
                  className={`font-display text-[17px] font-semibold tabular-nums tracking-[-0.5px] ${
                    isNegative ? "text-rose-500" : "text-neutral-950"
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
            </div>
          </div>
        )
      })}
    </div>
  )
}
