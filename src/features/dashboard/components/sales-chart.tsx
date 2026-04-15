"use client"

import { motion } from "motion/react"
import { formatCurrency } from "@/lib/utils"
import { CountUp } from "@/features/pos/components/count-up"

interface WeekData {
  label: string
  rango: string
  total: number
  enProgreso?: boolean
}

interface SalesChartProps {
  totalMes: number
  cambioMes: number
  semanas: WeekData[]
}

const SPRING = { type: "spring" as const, stiffness: 140, damping: 22 }

// Per-bar gradient + glow color stops — keyed left→right so later weeks intensify
const BAR_GRADIENTS: { from: string; to: string; glow: string }[] = [
  { from: "#FFE4EC", to: "#FFB8CB", glow: "rgba(244, 63, 107, 0.18)" },
  { from: "#FFCBD9", to: "#FF8FA8", glow: "rgba(244, 63, 107, 0.22)" },
  { from: "#FFA8BD", to: "#FB6E89", glow: "rgba(244, 63, 107, 0.28)" },
  { from: "#FB8298", to: "#F43F6B", glow: "rgba(244, 63, 107, 0.36)" },
]

const ACTIVE_GRADIENT = {
  from: "#FB6E89",
  to: "#E11D52",
  glow: "rgba(225, 29, 82, 0.45)",
}

export function SalesChart({ totalMes, cambioMes, semanas }: SalesChartProps) {
  const maxTotal = Math.max(...semanas.map((s) => s.total)) || 1
  const bestWeekIndex = semanas.findIndex(
    (s) => s.total === maxTotal && !s.enProgreso
  )

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-2.5">
        <CountUp
          value={totalMes}
          format={formatCurrency}
          className="text-2xl font-extrabold tracking-tight text-neutral-950"
        />
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING, delay: 0.4 }}
          className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success-dark"
        >
          +{cambioMes}%
        </motion.span>
      </div>

      {/* Bars */}
      <div className="mt-5">
        <div className="space-y-3">
          {semanas.map((semana, i) => {
            const pct = (semana.total / maxTotal) * 100
            const isBest = i === bestWeekIndex
            const isActive = !!semana.enProgreso
            const grad = isActive
              ? ACTIVE_GRADIENT
              : BAR_GRADIENTS[Math.min(i, BAR_GRADIENTS.length - 1)]

            return (
              <motion.div
                key={semana.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: 0.1 + i * 0.08 }}
                className="group flex items-center gap-2 sm:gap-3"
              >
                {/* Week label */}
                <div className="w-12 shrink-0 text-right sm:w-16">
                  <p
                    className={`text-[12px] font-semibold transition-colors ${
                      isActive ? "text-rose-600" : "text-neutral-700"
                    }`}
                  >
                    {semana.label}
                    {isBest && (
                      <span
                        className="ml-0.5 text-amber-400"
                        aria-label="mejor semana"
                      >
                        ★
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-neutral-400">{semana.rango}</p>
                </div>

                {/* Bar */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
                  <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-neutral-50/80 ring-1 ring-inset ring-neutral-100">
                    <motion.div
                      className="relative h-full rounded-lg"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 4)}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 90,
                        damping: 18,
                        delay: 0.18 + i * 0.08,
                      }}
                      style={{
                        background: `linear-gradient(90deg, ${grad.from} 0%, ${grad.to} 100%)`,
                        boxShadow: isActive
                          ? `0 0 24px 0 ${grad.glow}, 0 2px 8px 0 ${grad.glow}`
                          : isBest
                            ? `0 2px 12px 0 ${grad.glow}`
                            : "none",
                      }}
                    >
                      {/* Highlight stripe on top of bar */}
                      <motion.div
                        className="pointer-events-none absolute inset-x-0 top-0 h-px"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
                        }}
                      />
                      {/* Glow tip — small dot at the right edge of the bar */}
                      <motion.div
                        className="pointer-events-none absolute top-1/2 right-0 size-2 -translate-y-1/2 translate-x-1/2 rounded-full"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          ...SPRING,
                          delay: 0.85 + i * 0.08,
                        }}
                        style={{
                          background: grad.to,
                          boxShadow: `0 0 8px 0 ${grad.glow}, 0 0 0 2px white`,
                        }}
                      />
                      {/* Active week pulse ring */}
                      {isActive && (
                        <motion.div
                          className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-rose-400/60"
                          animate={{ opacity: [0.3, 0.75, 0.3] }}
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                    </motion.div>
                  </div>
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.08, duration: 0.3 }}
                    className={`hidden w-20 shrink-0 text-right text-[13px] font-bold tabular-nums sm:block ${
                      isActive ? "text-rose-600" : "text-neutral-700"
                    }`}
                  >
                    {formatCurrency(semana.total)}
                  </motion.span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 flex items-center justify-between text-[10px] text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{
              background: `linear-gradient(135deg, ${ACTIVE_GRADIENT.from}, ${ACTIVE_GRADIENT.to})`,
              boxShadow: `0 0 6px 0 ${ACTIVE_GRADIENT.glow}`,
            }}
          />
          <span>Semana actual</span>
        </div>
        <span className="flex items-center gap-1">
          <span className="text-amber-400">★</span> Mejor semana
        </span>
      </div>
    </div>
  )
}
