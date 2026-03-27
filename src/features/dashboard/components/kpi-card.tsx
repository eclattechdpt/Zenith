"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

interface KpiCardProps {
  label: string
  value: number
  formatValue: (n: number) => string
  change: string
  trend: "up" | "alert"
  gradient: string
  hoverShadow?: string
  children?: ReactNode
}

function useCountUp(target: number, duration = 1000) {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return current
}

export function KpiCard({
  label,
  value,
  formatValue,
  change,
  trend,
  gradient,
  hoverShadow,
  children,
}: KpiCardProps) {
  const animatedValue = useCountUp(value)

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-md transition-shadow duration-200 ${hoverShadow ?? "hover:shadow-lg"}`}
    >
      {/* Label */}
      <span className="text-[10px] font-bold uppercase tracking-[2.5px] text-white/70">
        {label}
      </span>

      {/* Big number */}
      <p className="mt-2 text-[40px] leading-none font-extrabold tracking-tight text-white">
        {formatValue(animatedValue)}
      </p>

      {/* Change indicator */}
      <div className="mt-2 flex items-center gap-1">
        {trend === "up" && (
          <ArrowUpRight
            className="size-3 text-white/80"
            strokeWidth={2.5}
          />
        )}
        <span className="text-xs font-semibold text-white/80">{change}</span>
      </div>

      {/* Mini visualization */}
      {children && (
        <div className="mt-4 flex items-end justify-end">
          {children}
        </div>
      )}
    </motion.div>
  )
}
