"use client"

import { motion } from "motion/react"
import { ChevronDown, CheckCircle2 } from "lucide-react"

interface CollapsibleSectionProps {
  icon: React.ReactNode
  label: string
  isOpen: boolean
  onToggle: () => void
  filled?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({
  icon,
  label,
  isOpen,
  onToggle,
  filled,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#efe8e2] bg-[#faf6f3] shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-[#f5efe9] px-5 py-3.5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-500">
            {label}
          </p>
          {filled && !isOpen && <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 pt-3">{children}</div>
      </motion.div>
    </div>
  )
}
