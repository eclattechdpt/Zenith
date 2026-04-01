"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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

export default function CargaInicialPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-center sm:text-left">
          <Link
            href="/inventario"
            className="mb-2 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="size-3" />
            Inventarios
          </Link>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
            Carga Inicial
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Referencia historica del stock inicial de la empresa
          </p>
        </div>
      </motion.div>

      <InventoryTable inventoryType="initial_load" />
    </motion.div>
  )
}
