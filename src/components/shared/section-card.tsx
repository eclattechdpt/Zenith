"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, type LucideIcon } from "lucide-react"

type SectionTint = "rose" | "teal" | "blush" | "amber" | "emerald" | "violet"

interface SectionCardProps {
  label?: string
  description?: string
  icon?: LucideIcon
  /** Icon background class, e.g. "bg-rose-50" */
  iconBg?: string
  /** Icon color class, e.g. "text-rose-400" */
  iconColor?: string
  children: React.ReactNode
  /** Animation delay for stagger entrance */
  delay?: number
  /** Additional classes for the root element (e.g. grid column spans) */
  className?: string
  /** Optional semantic tint — overrides the default white background + neutral border */
  tint?: SectionTint
  /** Optional action element rendered on the right side of the header (e.g. expand button) */
  action?: React.ReactNode
  /** When true, header gets a chevron toggle and the body folds/unfolds */
  collapsible?: boolean
  /** Initial collapsed state when collapsible is true */
  defaultCollapsed?: boolean
}

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

const TINT_CLASSES: Record<SectionTint, string> = {
  rose: "border-rose-200/60 bg-gradient-to-br from-rose-50/70 via-white to-white",
  teal: "border-teal-200/60 bg-gradient-to-br from-teal-50/70 via-white to-white",
  blush: "border-blush-200/60 bg-gradient-to-br from-blush-50/70 via-white to-white",
  amber: "border-amber-200/60 bg-gradient-to-br from-amber-50/70 via-white to-white",
  emerald: "border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 via-white to-white",
  violet: "border-violet-200/60 bg-gradient-to-br from-violet-50/70 via-white to-white",
}

export function SectionCard({
  label,
  description,
  icon: Icon,
  iconBg = "bg-neutral-100",
  iconColor = "text-neutral-500",
  children,
  delay = 0,
  className,
  tint,
  action,
  collapsible = false,
  defaultCollapsed = false,
}: SectionCardProps) {
  const surface = tint ? TINT_CLASSES[tint] : "border-neutral-200/60 bg-white"
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const headerSpacingClass = collapsible
    ? collapsed
      ? ""
      : "mb-5"
    : "mb-5"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...SPRING, delay }}
      className={`w-full min-w-0 rounded-2xl border p-6 shadow-sm shadow-neutral-900/[0.03] ${surface} ${className ?? ""}`}
    >
      {label && (
        <div className={`flex items-center gap-2 ${headerSpacingClass}`}>
          {Icon && (
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
            >
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
              {label}
            </p>
            {description && (
              <p className="mt-0.5 text-[11px] text-neutral-400">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
          {collapsible && (
            <motion.button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expandir" : "Colapsar"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200/70 bg-white text-neutral-500 shadow-sm shadow-neutral-900/[0.02] transition-colors hover:border-neutral-300 hover:text-neutral-800"
            >
              <motion.span
                animate={{ rotate: collapsed ? -90 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="flex"
              >
                <ChevronDown className="size-4" strokeWidth={2.25} />
              </motion.span>
            </motion.button>
          )}
        </div>
      )}
      {collapsible ? (
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ height: { duration: 0.28, ease: [0.32, 0.72, 0, 1] }, opacity: { duration: 0.18 } }}
              className="overflow-hidden"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        children
      )}
    </motion.div>
  )
}
