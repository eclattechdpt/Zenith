"use client"

import { formatCurrency } from "@/lib/utils"

interface WeekData {
  label: string
  rango: string
  total: number
  enProgreso?: boolean
}

const BAR_COLORS = [
  "bg-blush-200",
  "bg-rose-200",
  "bg-rose-300",
  "bg-rose-400",
]

interface SalesChartProps {
  totalMes: number
  cambioMes: number
  semanas: WeekData[]
}

export function SalesChart({ totalMes, cambioMes, semanas }: SalesChartProps) {
  const maxTotal = Math.max(...semanas.map((s) => s.total))
  const bestWeekIndex = semanas.findIndex((s) => s.total === maxTotal && !s.enProgreso)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">
            Rendimiento de ventas
          </h2>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="text-2xl font-extrabold tracking-tight text-neutral-950">
              {formatCurrency(totalMes)}
            </span>
            <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success-dark">
              +{cambioMes}%
            </span>
          </div>
        </div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Este mes
        </span>
      </div>

      {/* Bars */}
      <div className="mt-6 space-y-3">
        {semanas.map((semana, i) => {
          const pct = (semana.total / maxTotal) * 100
          const isBest = i === bestWeekIndex
          const isActive = semana.enProgreso
          const barColor = BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)]

          return (
            <div key={semana.label} className="flex items-center gap-3">
              {/* Week label */}
              <div className="w-16 shrink-0 text-right">
                <p
                  className={`text-[12px] font-semibold ${
                    isActive ? "text-rose-500" : "text-neutral-700"
                  }`}
                >
                  {semana.label}
                  {isBest && <span className="text-neutral-400"> *</span>}
                </p>
                <p className="text-[10px] text-neutral-400">{semana.rango}</p>
              </div>

              {/* Bar */}
              <div className="flex flex-1 items-center gap-2.5">
                <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-neutral-50">
                  <div
                    className={`h-full rounded-lg transition-all duration-500 ${barColor} ${
                      isActive ? "ring-1 ring-rose-500" : ""
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span
                  className={`w-20 shrink-0 text-right text-[13px] font-bold tabular-nums ${
                    isActive ? "text-rose-600" : "text-neutral-700"
                  }`}
                >
                  {formatCurrency(semana.total)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex items-center justify-between text-[10px] text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-rose-400 ring-1 ring-rose-500" />
          <span>Semana actual (en progreso)</span>
        </div>
        <span>* Mejor semana</span>
      </div>
    </div>
  )
}
