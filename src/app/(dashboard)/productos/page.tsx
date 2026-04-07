"use client"

import { Suspense, useState, useCallback } from "react"

import { PageHero } from "@/components/shared/page-hero"
import { ProductKpiWidgets } from "@/features/productos/components/product-kpi-widgets"
import { ProductCatalog } from "@/features/productos/components/product-catalog"
import { ProductWizardDialog } from "@/features/productos/components/product-wizard-dialog"

export default function ProductosPage() {
  const [wizardOpen, setWizardOpen] = useState(false)

  const openWizard = useCallback(() => setWizardOpen(true), [])
  const closeWizard = useCallback(() => setWizardOpen(false), [])

  return (
    <Suspense>
    <>
      <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
        <PageHero
          title="Productos"
          ctaLabel="Nuevo producto"
          onCta={openWizard}
        />

        {/* KPI widgets */}
        <ProductKpiWidgets />

        {/* Product catalog (grid/list + search + filters) */}
        <ProductCatalog />
      </div>

      {/* Product creation wizard */}
      <ProductWizardDialog open={wizardOpen} onClose={closeWizard} />
    </>
    </Suspense>
  )
}
