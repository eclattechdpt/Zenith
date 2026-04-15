"use client"

import { motion } from "motion/react"
import { formatCurrency } from "@/lib/utils"

interface SalesProgressProps {
  today: number
  yesterday: number
  max: number
  variant?: "light" | "dark"
}

export function SalesProgress({ today, yesterday, max, variant = "light" }: SalesProgressProps) {
  const todayPct = Math.min((today / max) * 100, 100)
  const yesterdayPct = Math.min((yesterday / max) * 100, 100)
  const diff = today - yesterday
  const isAhead = diff >= 0

  const dark = variant === "dark"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold tracking-[0.3px]"
          style={{ color: dark ? "rgba(255,255,255,0.9)" : "#E11D52" }}
        >
          Hoy
        </span>
        <span
          className="text-[11px] font-semibold tracking-[0.3px]"
          style={{ color: dark ? "rgba(255,255,255,0.7)" : (isAhead ? "#E11D52" : "#9D1139") }}
        >
          {isAhead ? "+" : ""}{formatCurrency(diff)} {isAhead ? "adelante" : "atras"}
        </span>
      </div>
      {/* Overlapping bars */}
      <div className="relative h-[15px] w-full overflow-hidden rounded-sm">
        {/* Yesterday bar (background, lighter) */}
        <div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{
            width: `${yesterdayPct}%`,
            background: dark
              ? "rgba(255,255,255,0.2)"
              : "linear-gradient(90deg, #FFE0E8 0%, #FFCBD9 100%)",
          }}
        />
        {/* Today bar (foreground, darker, on top) */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{
            background: dark
              ? "linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.95) 100%)"
              : "linear-gradient(90deg, #FB6E89 0%, #E11D52 100%)",
            boxShadow: dark
              ? "0 0 8px rgba(255,255,255,0.3)"
              : "0 0 10px rgba(225,29,82,0.35)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${todayPct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.2 }}
        />
        {/* Highlight stripe */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
          }}
        />
      </div>
      {/* Scale labels */}
      <div
        className="flex items-center justify-between text-[10px]"
        style={{ color: dark ? "rgba(255,255,255,0.4)" : "#FF9DB5" }}
      >
        <span>$0</span>
        <span>{formatCurrency(max)}</span>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span
            className="size-2 rounded-sm"
            style={{ backgroundColor: dark ? "rgba(255,255,255,0.8)" : "#F43F6B" }}
          />
          <span
            className="text-[9px] font-medium"
            style={{ color: dark ? "rgba(255,255,255,0.7)" : "#E11D52" }}
          >
            Hoy
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="size-2 rounded-sm"
            style={{ backgroundColor: dark ? "rgba(255,255,255,0.2)" : "#FFE0E8" }}
          />
          <span
            className="text-[9px] font-medium"
            style={{ color: dark ? "rgba(255,255,255,0.7)" : "#E11D52" }}
          >
            Ayer {formatCurrency(yesterday)}
          </span>
        </div>
      </div>
    </div>
  )
}
