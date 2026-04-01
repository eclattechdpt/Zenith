"use client"

import { Package } from "lucide-react"

export interface InventoryAlert {
  nombre: string
  variante: string
  stockActual: number
  stockMinimo: number
  estado: "critico" | "bajo"
}

export function InventoryAlertsGrid({ alerts }: { alerts: InventoryAlert[] }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-b from-white to-amber-50/40 p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-neutral-900">
            Alertas de inventario
          </h2>
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
            {alerts.length}
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {alerts.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-400">
            Sin alertas de stock bajo
          </p>
        ) : (
          alerts.map((item) => {
            const isCritical = item.estado === "critico"
            const pct =
              item.stockMinimo > 0
                ? Math.round((item.stockActual / item.stockMinimo) * 100)
                : 0
            return (
              <div
                key={item.nombre + item.variante}
                className={`flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3  ${
                  isCritical
                    ? "border-l-[3px] border-l-error"
                    : "border-l-[3px] border-l-warning"
                }`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                    isCritical ? "bg-error-light" : "bg-warning-light"
                  }`}
                >
                  <Package
                    className={`size-4 ${
                      isCritical ? "text-error" : "text-warning"
                    }`}
                    strokeWidth={1.75}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-neutral-800">
                    {item.nombre}
                  </p>
                  <p className="truncate text-[11px] text-neutral-500">
                    {item.variante}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[13px] font-bold tabular-nums ${
                        isCritical ? "text-error" : "text-warning-dark"
                      }`}
                    >
                      {item.stockActual}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      / {item.stockMinimo}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full ${
                        isCritical ? "bg-error" : "bg-warning"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
