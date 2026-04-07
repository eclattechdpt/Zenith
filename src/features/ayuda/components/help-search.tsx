"use client"

import { Search, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

interface HelpSearchProps {
  value: string
  onChange: (value: string) => void
}

export function HelpSearch({ value, onChange }: HelpSearchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.08 }}
      className="relative"
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Busca un tema, accion o modulo..."
        className="h-12 w-full rounded-2xl border border-neutral-200/60 bg-white pl-11 pr-10 text-sm text-neutral-900 shadow-sm shadow-neutral-900/[0.03] outline-none transition-all placeholder:text-neutral-400 focus:border-teal-300 focus:ring-3 focus:ring-teal-500/10"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
