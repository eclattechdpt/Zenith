"use client"

import { motion } from "motion/react"
import type { LucideIcon } from "lucide-react"

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
}

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

export function SectionCard({
  label,
  description,
  icon: Icon,
  iconBg = "bg-neutral-100",
  iconColor = "text-neutral-500",
  children,
  delay = 0,
  className,
}: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...SPRING, delay }}
      className={`rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm shadow-neutral-900/[0.03] ${className ?? ""}`}
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
