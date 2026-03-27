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
          className="inline-flex items-center gap-[5px] rounded-[20px] px-3 py-[5px]"
          style={{
            backgroundColor: "#FFFFFF",
            border: "0.5px solid #FFDDE3",
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut", delay: i * 0.08 }}
        >
          <span
            className="size-[7px] shrink-0 rounded-full"
            style={{ backgroundColor: method.dotColor }}
          />
          <span className="text-[11px] font-semibold tracking-[0.3px]" style={{ color: "#9E4A60" }}>
            {method.label} {method.count}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
