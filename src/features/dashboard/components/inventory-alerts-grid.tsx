"use client"

import { Package } from "lucide-react"

interface Alert {
  nombre: string
  variante: string
  stockActual: number
  stockMinimo: number
  estado: string
}

export function InventoryAlertsGrid({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
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
        {alerts.map((item) => {
          const isCritical = item.estado === "critico"
          const pct = Math.round(
            (item.stockActual / item.stockMinimo) * 100
          )
          return (
            <div
              key={item.nombre + item.variante}
              className={`flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 transition-all duration-200 hover:border-neutral-200 hover:bg-white hover:shadow-sm ${
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
        })}
      </div>
    </div>
  )
}
