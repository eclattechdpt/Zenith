"use client"

import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
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

export function SalesChart({ totalMes, cambioMes, semanas }: SalesChartProps) {
  const maxTotal = Math.max(...semanas.map((s) => s.total)) || 1

  return (
    <div>
      {/* Hero summary — huge Zodiak number + inline trend pill */}
      <div className="flex items-baseline gap-2.5">
        <CountUp
          value={totalMes}
          format={formatCurrency}
          className="block font-display text-[44px] font-semibold leading-none tracking-[-1.5px] text-neutral-950 sm:text-[56px]"
        />
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING, delay: 0.3 }}
          className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
        >
          <ArrowUpRight className="size-3" strokeWidth={2.25} />+{cambioMes}%
        </motion.span>
      </div>

      {/* Stripped horizontal bars — label · bar · value */}
      <div className="mt-6 space-y-3">
        {semanas.map((semana, i) => {
          const pct = (semana.total / maxTotal) * 100
          const isActive = !!semana.enProgreso

          return (
            <motion.div
              key={semana.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING, delay: 0.1 + i * 0.06 }}
              className="flex items-center gap-3"
            >
              <div className="w-14 shrink-0">
                <p
                  className={`text-[12px] font-semibold ${
                    isActive ? "text-rose-600" : "text-neutral-700"
                  }`}
                >
                  {semana.label}
                </p>
                <p className="text-[10px] text-neutral-400">{semana.rango}</p>
              </div>

              <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-neutral-50">
                <motion.div
                  className="h-full rounded-md"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 4)}%` }}
                  transition={{
                    type: "spring",
                    stiffness: 90,
                    damping: 18,
                    delay: 0.2 + i * 0.06,
                  }}
                  style={{
                    background: isActive
                      ? "linear-gradient(90deg, #FB6E89 0%, #E11D52 100%)"
                      : "linear-gradient(90deg, #FFE0E8 0%, #FFC2D4 100%)",
                  }}
                />
              </div>

              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.06 }}
                className={`w-20 shrink-0 text-right text-[13px] font-bold tabular-nums ${
                  isActive ? "text-rose-600" : "text-neutral-700"
                }`}
              >
                {formatCurrency(semana.total)}
              </motion.span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
