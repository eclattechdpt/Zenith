"use client"

import { motion } from "motion/react"
import { Settings, FolderTree, Percent } from "lucide-react"

import { CategoryManager } from "@/features/productos/components/category-manager"
import { PriceListManager } from "@/features/clientes/components/price-list-manager"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

export default function ConfiguracionPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-w-0 flex-1 space-y-8 p-5 sm:p-8"
    >
      {/* Hero header */}
      <motion.div
        variants={itemVariants}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
          <Settings className="h-3.5 w-3.5" />
          Ajustes del sistema
        </p>
        <h1 className="mt-1 font-display text-[38px] font-semibold leading-none tracking-[-1.5px] text-neutral-950 sm:text-[48px]">
          Configuracion
        </h1>
      </motion.div>

      {/* Categories */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm shadow-neutral-900/[0.03]"
      >
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
            <FolderTree className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
              Categorias
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              Organiza tus productos en categorias y subcategorias
            </p>
          </div>
        </div>
        <CategoryManager />
      </motion.div>

      {/* Discounts */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm shadow-neutral-900/[0.03]"
      >
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
            <Percent className="h-4 w-4 text-teal-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
              Descuentos personalizados
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              Define descuentos para diferentes tipos de clientes
            </p>
          </div>
        </div>
        <PriceListManager />
      </motion.div>
    </motion.div>
  )
}
