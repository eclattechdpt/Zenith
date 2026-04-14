"use client"

import { motion } from "motion/react"
import type { LucideIcon } from "lucide-react"

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
}

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

const TINT_CLASSES: Record<SectionTint, string> = {
  rose: "border-rose-200/60 bg-rose-50/40",
  teal: "border-teal-200/60 bg-teal-50/40",
  blush: "border-blush-200/60 bg-blush-50/40",
  amber: "border-amber-200/60 bg-amber-50/40",
  emerald: "border-emerald-200/60 bg-emerald-50/40",
  violet: "border-violet-200/60 bg-violet-50/40",
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
}: SectionCardProps) {
  const surface = tint ? TINT_CLASSES[tint] : "border-neutral-200/60 bg-white"
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...SPRING, delay }}
      className={`rounded-2xl border p-6 shadow-sm shadow-neutral-900/[0.03] ${surface} ${className ?? ""}`}
    >
      {label && (
        <div className="mb-5 flex items-center gap-2">
          {Icon && (
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
            >
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
          )}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
              {label}
            </p>
            {description && (
              <p className="mt-0.5 text-[11px] text-neutral-400">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      {children}
    </motion.div>
  )
}
