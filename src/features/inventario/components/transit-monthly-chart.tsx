"use client"

import { formatCurrency } from "@/lib/utils"
import type { TransitMonthSummary } from "../types"

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const BAR_COLORS = [
  "bg-blue-100", "bg-blue-200", "bg-blue-300", "bg-blue-400",
]

interface TransitMonthlyChartProps {
  months: TransitMonthSummary[]
  selectedMonth?: number | null
  onSelectMonth?: (month: number) => void
}

export function TransitMonthlyChart({
  months,
  selectedMonth,
  onSelectMonth,
}: TransitMonthlyChartProps) {
  if (months.length === 0) return null

  const maxTotal = Math.max(...months.map((m) => m.total_value), 1)

  return (
    <div>
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-bold text-neutral-900">Valor mensual</h2>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          {months.length} {months.length === 1 ? "mes" : "meses"}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {months.map((m, i) => {
          const pct = (m.total_value / maxTotal) * 100
          const isSelected = m.month === selectedMonth
          const barColor = BAR_COLORS[i % BAR_COLORS.length]
          const monthName = MONTH_NAMES[m.month - 1]

          return (
            <button
              key={m.month}
              type="button"
              onClick={() => onSelectMonth?.(m.month)}
              className="flex w-full items-center gap-2 sm:gap-3 text-left hover:opacity-80 transition-opacity"
            >
              <div className="w-20 shrink-0 text-right sm:w-24">
                <p
                  className={`text-[12px] font-semibold ${
                    isSelected ? "text-blue-600" : "text-neutral-700"
                  }`}
                >
                  {monthName}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {m.week_count} {m.week_count === 1 ? "semana" : "semanas"}
                </p>
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
                <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-neutral-50">
                  <div
                    className={`h-full rounded-lg transition-all duration-500 ${barColor} ${
                      isSelected ? "ring-1 ring-blue-500" : ""
                    }`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span
                  className={`hidden w-24 shrink-0 text-right text-[13px] font-bold tabular-nums sm:block ${
                    isSelected ? "text-blue-600" : "text-neutral-700"
                  }`}
                >
                  {formatCurrency(m.total_value)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { MONTH_NAMES }
