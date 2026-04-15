"use client"

import { motion } from "motion/react"

interface WeeklyBarChartProps {
  data: number[]
  labels: string[]
  currentDayIndex: number
}

// Gradients — escalate intensity as week progresses
const BAR_GRADIENTS: { from: string; to: string }[] = [
  { from: "#D6F4F7", to: "#B2ECF0" }, // Mon - lightest
  { from: "#D6F4F7", to: "#B2ECF0" }, // Tue
  { from: "#B2ECF0", to: "#7DDCE4" }, // Wed
  { from: "#B2ECF0", to: "#7DDCE4" }, // Thu
  { from: "#7DDCE4", to: "#25A6B6" }, // Fri - boldest
  { from: "#7DDCE4", to: "#25A6B6" }, // Sat
  { from: "#B2ECF0", to: "#7DDCE4" }, // Sun
]

export function WeeklyBarChart({ data, labels, currentDayIndex }: WeeklyBarChartProps) {
  const max = Math.max(...data)

  return (
    <div className="flex items-end gap-1">
      {data.map((value, i) => {
        const heightPct = max > 0 ? (value / max) * 100 : 0
        const isFuture = i > currentDayIndex
        const isCurrent = i === currentDayIndex
        const grad = BAR_GRADIENTS[i]

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
                  className="relative w-full rounded-t-[3px]"
                  style={{
                    background: `linear-gradient(180deg, ${grad.to} 0%, ${grad.from} 100%)`,
                    boxShadow: isCurrent
                      ? "0 0 10px rgba(37, 166, 182, 0.5), 0 -1px 4px rgba(37, 166, 182, 0.3)"
                      : "none",
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, 8)}%` }}
                  transition={{
                    type: "spring",
                    stiffness: 110,
                    damping: 18,
                    delay: i * 0.06,
                  }}
                >
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-t-[3px] ring-1 ring-teal-400/60"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.div>
              )}
            </div>
            <span
              className="text-[9px]"
              style={{
                color: "#236C7D",
                fontWeight: isCurrent ? 600 : 400,
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
