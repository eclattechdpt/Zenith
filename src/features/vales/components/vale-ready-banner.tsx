"use client"

import { Ticket, X } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"

import { useReadyVales } from "../queries"

export function ValeReadyBanner() {
  const { data: readyVales = [] } = useReadyVales()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = readyVales.filter((v) => !dismissed.has(v.id))

  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {visible.map((vale) => (
          <motion.div
            key={vale.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5"
          >
            <Ticket className="size-4 shrink-0 text-emerald-600" />
            <p className="flex-1 text-sm text-emerald-800">
              <span className="font-semibold">{vale.vale_number}</span>
              {" — "}
              {vale.customers?.name} — Producto disponible para entrega
            </p>
            <button
              type="button"
              onClick={() =>
                setDismissed((prev) => new Set([...prev, vale.id]))
              }
              className="rounded-lg p-1 text-emerald-500 transition-colors hover:bg-emerald-100"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
