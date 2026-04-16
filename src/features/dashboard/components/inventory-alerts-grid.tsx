"use client"

import { motion } from "motion/react"
import { AlertTriangle } from "lucide-react"

export interface InventoryAlert {
  nombre: string
  variante: string
  stockActual: number
  stockMinimo: number
  estado: "critico" | "bajo"
}

const SPRING = { type: "spring" as const, stiffness: 100, damping: 18 }

export function InventoryAlertsGrid({ alerts }: { alerts: InventoryAlert[] }) {
  if (alerts.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-neutral-400">
        Sin alertas de stock bajo
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.map((item, i) => {
        const isCritical = item.estado === "critico"
        const pct =
          item.stockMinimo > 0
            ? (item.stockActual / item.stockMinimo) * 100
            : 0

        return (
          <motion.div
            key={`${item.nombre}-${item.variante}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING, delay: 0.1 + i * 0.06 }}
            className="flex items-center gap-3.5"
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                isCritical ? "bg-rose-50" : "bg-amber-50"
              }`}
            >
              <AlertTriangle
                className={`size-[17px] ${
                  isCritical ? "text-rose-500" : "text-amber-600"
                }`}
                strokeWidth={1.75}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`font-display text-[22px] font-semibold leading-none tabular-nums tracking-[-0.5px] ${
                    isCritical ? "text-rose-600" : "text-amber-700"
                  }`}
                >
                  {item.stockActual}
                  <span className="ml-0.5 text-[12px] font-medium text-neutral-400">
                    /{item.stockMinimo}
                  </span>
                </span>
                <span className="truncate text-[12px] font-medium text-neutral-500">
                  {item.nombre}
                </span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                <motion.div
                  className={`h-full rounded-full ${
                    isCritical ? "bg-rose-500" : "bg-amber-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{
                    ...SPRING,
                    delay: 0.25 + i * 0.06,
                  }}
                />
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
