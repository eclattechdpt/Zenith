"use client"

import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/shared/page-hero"
import { InventoryTable } from "@/features/inventario/components/inventory-table"

export default function CargaInicialPage() {
  return (
    <Suspense>
      <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="mb-3"
          >
            <Link
              href="/inventario"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <ArrowLeft className="size-3" />
              Inventarios
            </Link>
          </motion.div>
          <PageHero
            title="Carga Inicial"
            subtitle="Referencia historica del stock inicial de la empresa"
          />
        </div>

        <InventoryTable inventoryType="initial_load" />
      </div>
    </Suspense>
  )
}
