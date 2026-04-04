"use client"

import Link from "next/link"
import { ArrowLeft, Archive } from "lucide-react"
import { motion } from "motion/react"

import { InventoryTable } from "@/features/inventario/components/inventory-table"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function CargaInicialPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-w-0 flex-1 space-y-8 p-5 sm:p-8"
    >
      <motion.div variants={itemVariants} className="text-center sm:text-left">
        <motion.div
          whileHover={{ x: -2 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="inline-block"
        >
          <Link
            href="/inventario"
            className="group mb-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <ArrowLeft className="size-3" />
            Inventarios
          </Link>
        </motion.div>
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400 sm:justify-start">
          <Archive className="h-3.5 w-3.5 text-slate-400" />
          Carga Inicial
        </p>
        <h1 className="mt-2 font-display text-[38px] font-semibold leading-none tracking-[-1.5px] text-neutral-950 sm:text-[48px]">
          Carga Inicial
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Referencia historica del stock inicial de la empresa
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <InventoryTable inventoryType="initial_load" />
      </motion.div>
    </motion.div>
  )
}
