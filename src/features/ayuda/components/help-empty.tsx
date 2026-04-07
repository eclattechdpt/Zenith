"use client"

import { motion } from "motion/react"
import { SearchX } from "lucide-react"

export function HelpEmpty({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
        <SearchX className="h-6 w-6 text-neutral-400" />
      </div>
      <p className="mt-4 text-sm font-medium text-neutral-700">
        No encontramos resultados para &ldquo;{query}&rdquo;
      </p>
      <p className="mt-1 text-[12px] text-neutral-400">
        Intenta con otros terminos o revisa la seccion de contacto
      </p>
    </motion.div>
  )
}
