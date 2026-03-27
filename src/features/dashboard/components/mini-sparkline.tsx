"use client"

import { motion } from "motion/react"

interface WeeklyBarChartProps {
  data: number[]
  labels: string[]
  currentDayIndex: number
}

const BAR_COLORS = [
  "#B2ECF0", // Mon - lightest (teal-200)
  "#B2ECF0", // Tue
  "#7DDCE4", // Wed (teal-300)
  "#7DDCE4", // Thu
  "#25A6B6", // Fri - boldest (teal-500)
  "#25A6B6", // Sat
  "#7DDCE4", // Sun (if has data)
]

export function WeeklyBarChart({ data, labels, currentDayIndex }: WeeklyBarChartProps) {
  const max = Math.max(...data)

  return (
    <div className="flex items-end gap-1">
      {data.map((value, i) => {
        const heightPct = max > 0 ? (value / max) * 100 : 0
        const isFuture = i > currentDayIndex

        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex h-[40px] w-full items-end">
              {isFuture ? (
                <div
                  className="w-full rounded-t-[3px]"
                  style={{
                    height: "6px",
                    border: "1.5px dashed #B2ECF0",
                    background: "transparent",
                  }}
                />
              ) : (
                <motion.div
                  className="w-full rounded-t-[3px]"
                  style={{ backgroundColor: BAR_COLORS[i] }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, 8)}%` }}
                  transition={{
                    duration: 0.25,
                    ease: "easeInOut",
                    delay: i * 0.05,
                  }}
                />
              )}
            </div>
            <span
              className="text-[9px]"
              style={{
                color: "#236C7D",
                fontWeight: i === currentDayIndex ? 500 : 400,
              }}
            >
              {labels[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
