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
        <span className="text-[11px] font-semibold tracking-[0.3px]" style={{ color: "#854D0E" }}>
          Salud del inventario
        </span>
        <span className="text-[11px] font-semibold tracking-[0.3px]" style={{ color: "#854D0E" }}>
          {Math.round(okPct)}% OK
        </span>
      </div>
      {/* Stacked bar — no gaps */}
      <div className="flex h-[15px] w-full gap-[3px]">
        <motion.div
          className="relative h-full overflow-hidden rounded-sm"
          style={{
            background: "linear-gradient(90deg, #7BD9B8 0%, #4FBE96 100%)",
            boxShadow: "0 0 6px rgba(93, 202, 165, 0.4)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${okPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
            }}
          />
        </motion.div>
        <motion.div
          className="relative h-full overflow-hidden rounded-sm"
          style={{
            background: "linear-gradient(90deg, #F5B847 0%, #EF9F27 100%)",
            boxShadow: "0 0 6px rgba(239, 159, 39, 0.4)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${bajoPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.08 }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
            }}
          />
        </motion.div>
        <motion.div
          className="relative h-full overflow-hidden rounded-sm"
          style={{
            background: "linear-gradient(90deg, #EF6B6A 0%, #E24B4A 100%)",
            boxShadow: "0 0 6px rgba(226, 75, 74, 0.4)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${criticoPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.16 }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
            }}
          />
        </motion.div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-sm" style={{ backgroundColor: "#5DCAA5" }} />
          <span className="text-[10px]" style={{ color: "#854D0E" }}>OK {ok}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-sm" style={{ backgroundColor: "#EF9F27" }} />
          <span className="text-[10px]" style={{ color: "#854D0E" }}>Bajo {bajo}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-sm" style={{ backgroundColor: "#E24B4A" }} />
          <span className="text-[10px]" style={{ color: "#854D0E" }}>Critico {critico}</span>
        </div>
      </div>
    </div>
  )
}
