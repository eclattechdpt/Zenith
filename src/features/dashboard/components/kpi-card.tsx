"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  label: string
  value: number
  formatValue: (n: number) => string
  change: string
  trend: "up" | "alert"
  icon: LucideIcon
  bg: string
  borderColor: string
  labelColor: string
  numberColor: string
  iconBg: string
  iconColor: string
  pillBg: string
  pillText: string
  children?: ReactNode
}

function useCountUp(target: number, duration = 800) {
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
  icon: Icon,
  bg,
  borderColor,
  labelColor,
  numberColor,
  iconBg,
  iconColor,
  pillBg,
  pillText,
  children,
}: KpiCardProps) {
  const animatedValue = useCountUp(value)

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[16px] bg-gradient-to-b ${bg} p-5 shadow-sm`}
      style={{ border: `1px solid ${borderColor}` }}
    >
      {/* Header: label + icon (overline style) */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-[2.5px]"
          style={{ color: labelColor }}
        >
          {label}
        </span>
        <div
          className="flex size-8 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: `${iconColor}1F` }}
        >
          <Icon className="size-4" style={{ color: iconColor }} strokeWidth={1.75} />
        </div>
      </div>

      {/* Big number (price style) */}
      <p
        className="mt-3 text-[24px] leading-none font-extrabold tracking-[-0.5px]"
        style={{ color: numberColor }}
      >
        {formatValue(animatedValue)}
      </p>

      {/* Delta badge */}
      <div className="mt-2">
        <span
          className="inline-flex items-center gap-1 rounded-[20px] px-2.5 py-[3px] text-[12px] font-medium leading-[16px]"
          style={{ backgroundColor: pillBg, color: pillText }}
        >
          {trend === "up" && (
            <ArrowUpRight className="size-3" strokeWidth={2.5} />
          )}
          {change}
        </span>
      </div>

      {/* Spacer + Mini visualization */}
      {children && (
        <>
          <div className="min-h-4 max-h-8 flex-1" />
          <div>{children}</div>
        </>
      )}
    </div>
  )
}
