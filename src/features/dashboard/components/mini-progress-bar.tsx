"use client"

import { motion } from "motion/react"

interface InventoryHealthProps {
  ok: number
  bajo: number
  critico: number
}

export function InventoryHealth({ ok, bajo, critico }: InventoryHealthProps) {
  const total = ok + bajo + critico
  const okPct = (ok / total) * 100
  const bajoPct = (bajo / total) * 100
  const criticoPct = (critico / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.3px]" style={{ color: "#854F0B" }}>
          Salud del inventario
        </span>
        <span className="text-[11px] font-semibold tracking-[0.3px]" style={{ color: "#854F0B" }}>
          {Math.round(okPct)}% OK
        </span>
      </div>
      {/* Stacked bar */}
      <div className="flex h-[10px] w-full gap-[2px] overflow-hidden rounded-[5px]">
        <motion.div
          className="rounded-[5px]"
          style={{ backgroundColor: "#5DCAA5" }}
          initial={{ width: 0 }}
          animate={{ width: `${okPct}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        <motion.div
          className="rounded-[5px]"
          style={{ backgroundColor: "#EF9F27" }}
          initial={{ width: 0 }}
          animate={{ width: `${bajoPct}%` }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        />
        <motion.div
          className="rounded-[5px]"
          style={{ backgroundColor: "#E24B4A" }}
          initial={{ width: 0 }}
          animate={{ width: `${criticoPct}%` }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        />
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: "#5DCAA5" }} />
          <span className="text-[10px]" style={{ color: "#854D0E" }}>OK {ok}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: "#EF9F27" }} />
          <span className="text-[10px]" style={{ color: "#854D0E" }}>Bajo {bajo}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: "#E24B4A" }} />
          <span className="text-[10px]" style={{ color: "#854D0E" }}>Critico {critico}</span>
        </div>
      </div>
    </div>
  )
}
