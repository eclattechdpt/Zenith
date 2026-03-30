"use client"

import { Suspense } from "react"
import { Plus } from "lucide-react"
import Link from "next/link"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
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
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/productos/nuevo" />}
        >
          <Plus className="mr-1.5 size-4" />
          Nuevo producto
        </Button>
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
