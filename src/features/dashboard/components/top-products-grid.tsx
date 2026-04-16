"use client"

import { motion } from "motion/react"

interface Product {
  nombre: string
  variante: string
  unidades: number
  ingresos: number
  margen: number
}

const THUMB_GRADIENTS = [
  "from-rose-100 to-rose-200",
  "from-blush-100 to-blush-200",
  "from-neutral-100 to-neutral-200",
]
const THUMB_LETTER_COLORS = [
  "text-rose-600",
  "text-blush-700",
  "text-neutral-600",
]

const SPRING = { type: "spring" as const, stiffness: 140, damping: 22 }

export function TopProductsGrid({ products }: { products: Product[] }) {
  return (
    <div className="space-y-4">
      {products.map((p, i) => {
        const gradient = THUMB_GRADIENTS[Math.min(i, 2)]
        const letterColor = THUMB_LETTER_COLORS[Math.min(i, 2)]
        const initial = p.nombre[0]?.toUpperCase() ?? "?"

        return (
          <motion.div
            key={`${p.nombre}-${i}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING, delay: 0.1 + i * 0.08 }}
            className="flex items-center gap-4"
          >
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient}`}
            >
              <span
                className={`font-display text-[18px] font-semibold ${letterColor}`}
              >
                {initial}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium uppercase tracking-[1px] text-neutral-400">
                {p.nombre}
              </p>
              <p className="mt-0.5 flex items-baseline gap-1">
                <span className="font-display text-[28px] font-semibold leading-none tracking-[-1px] text-neutral-950 tabular-nums">
                  {p.unidades}
                </span>
                <span className="text-[12px] font-medium text-neutral-400">
                  uds.
                </span>
              </p>
            </div>

            <span className="shrink-0 text-[14px] font-semibold tabular-nums text-neutral-400">
              {p.margen}%
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
