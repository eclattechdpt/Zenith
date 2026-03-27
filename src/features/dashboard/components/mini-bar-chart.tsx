"use client"

import { motion } from "motion/react"
import { formatCurrency } from "@/lib/utils"

interface SalesProgressProps {
  today: number
  yesterday: number
  max: number
}

export function SalesProgress({ today, yesterday, max }: SalesProgressProps) {
  const todayPct = Math.min((today / max) * 100, 100)
  const yesterdayPct = Math.min((yesterday / max) * 100, 100)
  const diff = today - yesterday
  const isAhead = diff >= 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.3px]" style={{ color: "#E11D52" }}>
          Hoy
        </span>
        <span className="text-[11px] font-semibold tracking-[0.3px]" style={{ color: isAhead ? "#E11D52" : "#9D1139" }}>
          {isAhead ? "+" : ""}{formatCurrency(diff)} {isAhead ? "adelante" : "atras"}
        </span>
      </div>
      {/* Overlapping bars */}
      <div className="relative h-4 w-full">
        {/* Yesterday bar (background, lighter) */}
        <div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{
            width: `${yesterdayPct}%`,
            backgroundColor: "#FFE0E8",
          }}
        />
        {/* Today bar (foreground, darker, on top) */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{ backgroundColor: "#F43F6B" }}
          initial={{ width: 0 }}
          animate={{ width: `${todayPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {/* Scale labels */}
      <div className="flex items-center justify-between text-[10px]" style={{ color: "#FF9DB5" }}>
        <span>$0</span>
        <span>{formatCurrency(max)}</span>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-sm" style={{ backgroundColor: "#F43F6B" }} />
          <span className="text-[9px] font-medium" style={{ color: "#E11D52" }}>Hoy</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-sm" style={{ backgroundColor: "#FFE0E8" }} />
          <span className="text-[9px] font-medium" style={{ color: "#E11D52" }}>Ayer {formatCurrency(yesterday)}</span>
        </div>
      </div>
    </div>
  )
}
