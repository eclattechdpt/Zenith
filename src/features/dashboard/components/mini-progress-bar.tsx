"use client"

import { motion } from "motion/react"

interface InventoryHealthProps {
  ok: number
  bajo: number
  critico: number
}

export function InventoryHealth({ ok, bajo, critico }: InventoryHealthProps) {
  const total = ok + bajo + critico || 1
  const okPct = (ok / total) * 100
  const bajoPct = (bajo / total) * 100
  const criticoPct = (critico / total) * 100

  return (
    <div className="space-y-2.5">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <motion.div
          className="absolute inset-y-0 left-0 bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${okPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.15 }}
        />
        <motion.div
          className="absolute inset-y-0 bg-amber-500"
          style={{ left: `${okPct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${bajoPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.25 }}
        />
        <motion.div
          className="absolute inset-y-0 bg-rose-500"
          style={{ left: `${okPct + bajoPct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${criticoPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.35 }}
        />
      </div>
      <div className="flex items-center gap-3 text-[10px] tabular-nums">
        <span className="inline-flex items-center gap-1 text-neutral-500">
          <span className="size-[7px] rounded-full bg-emerald-500" />
          OK {ok}
        </span>
        <span className="inline-flex items-center gap-1 text-neutral-500">
          <span className="size-[7px] rounded-full bg-amber-500" />
          Bajo {bajo}
        </span>
        <span className="inline-flex items-center gap-1 text-neutral-500">
          <span className="size-[7px] rounded-full bg-rose-500" />
          Crítico {critico}
        </span>
      </div>
    </div>
  )
}
