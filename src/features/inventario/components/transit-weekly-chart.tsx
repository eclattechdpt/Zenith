"use client"

import { formatCurrency } from "@/lib/utils"
import type { TransitWeekWithItems } from "../types"

const BAR_COLORS = [
  "bg-blue-100",
  "bg-blue-200",
  "bg-blue-300",
  "bg-blue-400",
]

interface TransitWeeklyChartProps {
  weeks: TransitWeekWithItems[]
  onSelectWeek?: (weekId: string) => void
  selectedWeekId?: string | null
}

export function TransitWeeklyChart({
  weeks,
  onSelectWeek,
  selectedWeekId,
}: TransitWeeklyChartProps) {
  if (weeks.length === 0) return null

  const maxTotal = Math.max(...weeks.map((w) => Number(w.total_value)), 1)

  // Show up to 12 most recent weeks, reversed to show oldest first (left to right)
  const displayWeeks = weeks.slice(0, 12).reverse()

  return (
    <div>
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-bold text-neutral-900">
          Valor semanal
        </h2>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Ultimas {displayWeeks.length} semanas
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {displayWeeks.map((week, i) => {
          const pct = (Number(week.total_value) / maxTotal) * 100
          const isSelected = week.id === selectedWeekId
          const barColor = BAR_COLORS[Math.min(i % BAR_COLORS.length, BAR_COLORS.length - 1)]

          return (
            <button
              key={week.id}
              type="button"
              onClick={() => onSelectWeek?.(week.id)}
              className="flex w-full items-center gap-2 sm:gap-3 text-left hover:opacity-80 transition-opacity"
            >
              <div className="w-12 shrink-0 text-right sm:w-16">
                <p
                  className={`text-[12px] font-semibold ${
                    isSelected ? "text-blue-600" : "text-neutral-700"
                  }`}
                >
                  Sem {week.week_number}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {week.label || `${week.year}`}
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
                  className={`hidden w-20 shrink-0 text-right text-[13px] font-bold tabular-nums sm:block ${
                    isSelected ? "text-blue-600" : "text-neutral-700"
                  }`}
                >
                  {formatCurrency(Number(week.total_value))}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
