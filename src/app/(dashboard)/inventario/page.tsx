"use client"

import { motion } from "motion/react"

import { InventoryTable } from "@/features/inventario/components/inventory-table"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function InventarioPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-center sm:text-left">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
            Inventario
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Control de stock, ajustes y movimientos
          </p>
        </div>
      </motion.div>

      {/* Table */}
      <InventoryTable />
    </motion.div>
  )
}
