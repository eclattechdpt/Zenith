"use client"

import { motion } from "motion/react"

interface WeeklyBarChartProps {
  data: number[]
  labels: string[]
  currentDayIndex: number
}

export function WeeklyBarChart({
  data,
  labels,
  currentDayIndex,
}: WeeklyBarChartProps) {
  const max = Math.max(...data) || 1

  return (
    <div className="space-y-2">
      <div className="relative flex h-14 items-end gap-1.5">
        {data.map((value, i) => {
          const heightPct = (value / max) * 100
          const isFuture = i > currentDayIndex
          const isCurrent = i === currentDayIndex

          if (isFuture) {
            return (
              <div key={i} className="flex-1">
                <div className="h-2 rounded-full border border-dashed border-neutral-200" />
              </div>
            )
          }

          return (
            <div key={i} className="relative flex flex-1 items-end">
              <motion.div
                className="relative w-full rounded-md"
                style={{
                  background: isCurrent
                    ? "linear-gradient(180deg, #40C2D0 0%, #25A6B6 100%)"
                    : "linear-gradient(180deg, #D6F6F8 0%, #B2ECF0 100%)",
                  minHeight: "6px",
                }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, 14)}%` }}
                transition={{
                  type: "spring",
                  stiffness: 110,
                  damping: 18,
                  delay: i * 0.05,
                }}
              >
                {isCurrent && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.25 }}
                    className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[10px] font-bold tabular-nums text-teal-700"
                  >
                    {value}
                  </motion.span>
                )}
              </motion.div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-1.5">
        {labels.map((label, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[9px] tracking-wider ${
              i === currentDayIndex
                ? "font-bold text-teal-700"
                : "text-neutral-400"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
