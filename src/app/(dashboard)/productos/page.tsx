"use client"

import { Suspense } from "react"
import { Plus, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { motion } from "motion/react"

import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { ProductTable } from "@/features/productos/components/product-table"

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

export default function ProductosPage() {
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
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
            Productos
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Catalogo de productos y variantes
          </p>
        </div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Link
            href="/productos/nuevo"
            className="group flex items-center gap-3 rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50 to-rose-100/60 px-4 py-2.5 shadow-sm transition-all duration-200 hover:border-rose-300 hover:shadow-[0_4px_20px_rgba(244,63,107,0.15)]"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-200/60 transition-colors duration-200 group-hover:bg-rose-200">
              <Plus
                className="size-4 text-rose-600"
                strokeWidth={1.75}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-neutral-900">
                Nuevo producto
              </p>
              <p className="text-[11px] text-neutral-500">
                Agregar al catalogo
              </p>
            </div>
            <ArrowUpRight
              className="size-4 shrink-0 text-neutral-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-rose-400"
              strokeWidth={2}
            />
          </Link>
        </motion.div>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <div className="overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/30 p-4 shadow-sm sm:p-6">
          <Suspense fallback={<TableSkeleton />}>
            <ProductTable />
          </Suspense>
        </div>
      </motion.div>
    </motion.div>
  )
}
