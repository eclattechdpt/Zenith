"use client"

import { motion } from "motion/react"
import type { LucideIcon } from "lucide-react"

import { CountUp } from "@/features/pos/components/count-up"

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

interface KpiCardProps {
  title: string
  value: number
  subtitle: string
  icon: LucideIcon
  variant?: "hero" | "default"
  format?: (n: number) => string
  /** Icon background class for default variant, e.g. "bg-teal-50" */
  iconBg?: string
  /** Icon color class for default variant, e.g. "text-teal-500" */
  iconColor?: string
  /** Stagger delay in seconds */
  delay?: number
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  format: formatFn,
  iconBg = "bg-neutral-100",
  iconColor = "text-neutral-500",
  delay = 0,
}: KpiCardProps) {
  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-6 shadow-sm shadow-rose-500/10"
      >
        {/* Decorative ring */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[20px] border-white/10" />

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-rose-100">
            {title}
          </p>
        </div>

        <CountUp
          value={value}
          format={formatFn}
          className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-white sm:text-[42px]"
        />
        <p className="mt-1.5 text-[13px] font-medium text-rose-100">
          {subtitle}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay }}
      className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm shadow-neutral-900/[0.03]"
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
          {title}
        </p>
      </div>

      <CountUp
        value={value}
        format={formatFn}
        className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-neutral-900 sm:text-[42px]"
      />
      <p className="mt-1.5 text-[13px] font-medium text-neutral-400">
        {subtitle}
      </p>
    </motion.div>
  )
}
