"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"

import { CountUp } from "@/features/pos/components/count-up"

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

interface KpiBadge {
  label: string
  trend?: "up" | "down" | "neutral"
}

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
  /** Optional trend pill rendered inline next to the hero numeral */
  badge?: KpiBadge
  /** Override hero gradient classes, e.g. "from-rose-500 to-rose-600" */
  heroGradient?: string
  /** Override hero shadow class, e.g. "shadow-rose-500/10" */
  heroShadow?: string
  /** Mini-viz / chart rendered beneath the hero. Hidden when collapsed. */
  children?: React.ReactNode
  /** Add a chevron button (top-right) that expands / collapses the children. */
  collapsible?: boolean
  /** Initial collapsed state when collapsible is true. */
  defaultCollapsed?: boolean
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
  badge,
  heroGradient,
  heroShadow,
  children,
  collapsible = false,
  defaultCollapsed = false,
}: KpiCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const isHero = variant === "hero"

  const surfaceClass = isHero
    ? `bg-gradient-to-br ${heroGradient ?? "from-accent-500 to-accent-600"} text-white ${heroShadow ?? "shadow-accent-500/20"}`
    : "border border-neutral-200 bg-white text-neutral-900 shadow-neutral-900/[0.03]"

  const eyebrowClass = isHero ? "text-white/70" : "text-neutral-400"
  const heroTextClass = isHero ? "text-white" : "text-neutral-950"
  const subtitleClass = isHero ? "text-white/70" : "text-neutral-500"
  const iconContainerClass = isHero ? "bg-white/15" : iconBg
  const iconColorClass = isHero ? "text-white" : iconColor
  const chevronClass = isHero
    ? "bg-white/15 text-white hover:bg-white/25"
    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"

  const pillClass = (() => {
    if (!badge) return ""
    if (isHero) return "bg-white/20 text-white"
    if (badge.trend === "up") return "bg-emerald-50 text-emerald-700"
    if (badge.trend === "down") return "bg-rose-50 text-rose-600"
    return "bg-neutral-100 text-neutral-600"
  })()

  const ArrowIcon = badge?.trend === "down" ? ArrowDownRight : ArrowUpRight
  const heroSize = isHero
    ? "text-[48px] leading-[0.95] sm:text-[64px]"
    : "text-[40px] leading-[0.95] sm:text-[48px]"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay }}
      className={`relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-7 ${surfaceClass}`}
    >
      {/* Header row: circle icon + eyebrow title + optional chevron */}
      <div className="flex items-center gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${iconContainerClass}`}
        >
          <Icon
            className={`size-[18px] ${iconColorClass}`}
            strokeWidth={1.75}
          />
        </div>
        <p
          className={`min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[2px] ${eyebrowClass}`}
        >
          {title}
        </p>
        {collapsible && (
          <motion.button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expandir" : "Colapsar"}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors ${chevronClass}`}
          >
            <motion.span
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="flex"
            >
              <ChevronDown className="size-4" strokeWidth={2.25} />
            </motion.span>
          </motion.button>
        )}
      </div>

      {/* Hero row: huge number + inline pill, subtitle diagonal bottom-right */}
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <CountUp
            value={value}
            format={formatFn}
            className={`block font-display font-semibold tracking-[-1.5px] ${heroTextClass} ${heroSize}`}
          />
          {badge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...SPRING, delay: delay + 0.2 }}
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${pillClass}`}
            >
              {(badge.trend === "up" || badge.trend === "down") && (
                <ArrowIcon className="size-3" strokeWidth={2.25} />
              )}
              {badge.label}
            </motion.span>
          )}
        </div>
        <p
          className={`shrink-0 pb-1.5 text-right text-[11px] font-medium ${subtitleClass}`}
        >
          {subtitle}
        </p>
      </div>

      {/* Children (mini-viz) — hidden when collapsed */}
      {children && (
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="viz"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: {
                  duration: 0.28,
                  ease: [0.32, 0.72, 0, 1],
                },
                opacity: { duration: 0.18 },
              }}
              className="overflow-hidden"
            >
              <div className="mt-6">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}
