"use client"

import { motion } from "motion/react"
import { formatCurrency } from "@/lib/utils"

interface SalesProgressProps {
  today: number
  yesterday: number
  max: number
  variant?: "light" | "dark"
}

export function SalesProgress({
  today,
  yesterday,
  max,
  variant = "light",
}: SalesProgressProps) {
  const safeMax = max || 1
  const todayPct = Math.min((today / safeMax) * 100, 100)
  const yesterdayPct = Math.min((yesterday / safeMax) * 100, 100)
  const dark = variant === "dark"

  const labelColor = dark ? "text-white/75" : "text-rose-700"
  const trackBg = dark ? "bg-white/15" : "bg-rose-100"
  const fillBg = dark
    ? "linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,1) 100%)"
    : "linear-gradient(90deg, #FB6E89 0%, #E11D52 100%)"
  const markerBg = dark ? "bg-white/60" : "bg-rose-400"

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span
          className={`text-[11px] font-semibold uppercase tracking-[1.5px] ${labelColor}`}
        >
          Progreso del día
        </span>
        <span className={`text-[11px] font-semibold tabular-nums ${labelColor}`}>
          Ayer {formatCurrency(yesterday)}
        </span>
      </div>

      <div className={`relative h-2 w-full rounded-full ${trackBg}`}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: fillBg }}
          initial={{ width: 0 }}
          animate={{ width: `${todayPct}%` }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
            delay: 0.15,
          }}
        />
        <motion.div
          className={`absolute -inset-y-[3px] w-0.5 rounded-full ${markerBg}`}
          style={{ left: `${yesterdayPct}%` }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: 0.55, duration: 0.25 }}
        />
      </div>
    </div>
  )
}
