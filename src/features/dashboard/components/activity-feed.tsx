"use client"

import { ShoppingBag, RotateCcw, ClipboardList } from "lucide-react"
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
  ajuste: ClipboardList,
}

const styleMap: Record<string, { bg: string; color: string }> = {
  venta: { bg: "bg-neutral-100", color: "text-neutral-600" },
  devolucion: { bg: "bg-warning-light", color: "text-warning" },
  ajuste: { bg: "bg-info-light", color: "text-info" },
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="max-w-full min-w-0 rounded-2xl border border-blush-200/60 bg-gradient-to-b from-white to-blush-50/30 p-4 shadow-sm sm:p-6 xl:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-900">
          Actividad reciente
        </h2>
        <span className="text-[11px] font-medium text-neutral-400">
          Hoy
        </span>
      </div>
      <div className="mt-4 space-y-0.5">
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
                      isNegative ? "text-warning-dark" : "text-neutral-900"
                    }`}
                  >
                    {isNegative ? "-" : ""}
                    {formatCurrency(Math.abs(item.monto))}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-info">
                    ajuste
                  </span>
                )}
                <p className="text-[10px] text-neutral-400">{item.hora}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
