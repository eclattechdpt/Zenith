"use client"

import { motion } from "motion/react"

interface PaymentMethod {
  label: string
  count: number
  dotColor: string
}

interface PaymentBreakdownProps {
  methods: PaymentMethod[]
}

export function PaymentBreakdown({ methods }: PaymentBreakdownProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {methods.map((method, i) => (
        <motion.div
          key={method.label}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-2.5 py-1"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.07 }}
        >
          <span
            className="size-[7px] shrink-0 rounded-full"
            style={{ backgroundColor: method.dotColor }}
          />
          <span className="text-[11px] font-semibold tabular-nums text-neutral-700">
            {method.label}
            <span className="ml-1 font-medium text-neutral-400">
              {method.count}
            </span>
          </span>
        </motion.div>
      ))}
    </div>
  )
}
