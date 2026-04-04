"use client"

import { useMemo, useState, useCallback } from "react"
import { Plus, CalendarDays } from "lucide-react"
import { motion } from "motion/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { ProductKpiWidgets } from "@/features/productos/components/product-kpi-widgets"
import { ProductCatalog } from "@/features/productos/components/product-catalog"
import { ProductWizardDialog } from "@/features/productos/components/product-wizard-dialog"

export default function ProductosPage() {
  const [wizardOpen, setWizardOpen] = useState(false)

  const openWizard = useCallback(() => setWizardOpen(true), [])
  const closeWizard = useCallback(() => setWizardOpen(false), [])

  const todayLabel = useMemo(
    () =>
      format(new Date(), "EEEE, d 'de' MMMM", { locale: es }).replace(
        /^\w/,
        (c) => c.toUpperCase()
      ),
    []
  )

  return (
    <>
      <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {todayLabel}
            </p>
            <h1 className="mt-1 font-display text-[38px] font-semibold leading-none tracking-[-1.5px] text-neutral-950 sm:text-[48px]">
              Productos
            </h1>
          </div>

          {/* CTA — opens wizard dialog */}
          <motion.div
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              onClick={openWizard}
              className="group h-11 gap-2 rounded-xl bg-rose-500 px-6 text-sm font-bold text-white transition-colors hover:bg-rose-600 sm:h-12 sm:px-7"
            >
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              Nuevo producto
            </Button>
          </motion.div>
        </motion.div>

        {/* KPI widgets */}
        <ProductKpiWidgets />

        {/* Product catalog (grid/list + search + filters) */}
        <ProductCatalog />
      </div>

      {/* Product creation wizard */}
      <ProductWizardDialog open={wizardOpen} onClose={closeWizard} />
    </>
  )
}
