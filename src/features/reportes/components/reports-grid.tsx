"use client"

import {
  Receipt,
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  Warehouse,
  Truck,
  Archive,
} from "lucide-react"

import { ExportCard } from "./export-card"
import {
  exportSalesExcel,
  exportInventoryExcel,
  exportCustomersExcel,
  exportProductsExcel,
  exportTransitExcel,
  exportInitialLoadExcel,
} from "./excel-generators"

export function ExcelExports() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ExportCard
        title="Ventas"
        description="Historial completo de ventas con pagos y clientes"
        icon={Receipt}
        format="excel"
        onExport={exportSalesExcel}
      />
      <ExportCard
        title="Inventario Fisico"
        description="Stock actual, minimo y estado por producto"
        icon={Package}
        format="excel"
        onExport={exportInventoryExcel}
      />
      <ExportCard
        title="Inventario en Transito"
        description="Semanas de transito con productos y valores"
        icon={Truck}
        format="excel"
        onExport={exportTransitExcel}
      />
      <ExportCard
        title="Inventario Carga Inicial"
        description="Stock inicial con precios y nombres editados"
        icon={Archive}
        format="excel"
        onExport={exportInitialLoadExcel}
      />
      <ExportCard
        title="Clientes"
        description="Lista de clientes con datos de contacto"
        icon={Users}
        format="excel"
        onExport={exportCustomersExcel}
      />
      <ExportCard
        title="Productos"
        description="Catalogo completo con variantes y precios"
        icon={ShoppingBag}
        format="excel"
        onExport={exportProductsExcel}
      />
    </div>
  )
}

export function PdfExports() {
  async function handleSalesPdf() {
    const { exportSalesPdf } = await import("./pdf-generators")
    await exportSalesPdf()
  }

  async function handleInventoryPdf() {
    const { exportInventoryPdf } = await import("./pdf-generators")
    await exportInventoryPdf()
  }

  async function handleTransitPdf() {
    const { exportTransitPdf } = await import("./pdf-generators")
    await exportTransitPdf()
  }

  async function handleInitialLoadPdf() {
    const { exportInitialLoadPdf } = await import("./pdf-generators")
    await exportInitialLoadPdf()
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ExportCard
        title="Reporte de ventas"
        description="Resumen del mes con metricas y detalle de transacciones"
        icon={TrendingUp}
        format="pdf"
        onExport={handleSalesPdf}
      />
      <ExportCard
        title="Inventario Fisico"
        description="Stock actual con alertas y valor total"
        icon={Warehouse}
        format="pdf"
        onExport={handleInventoryPdf}
      />
      <ExportCard
        title="Inventario en Transito"
        description="Semanas de transito con productos y valores"
        icon={Truck}
        format="pdf"
        onExport={handleTransitPdf}
      />
      <ExportCard
        title="Inventario Carga Inicial"
        description="Stock inicial con precios editados y valor total"
        icon={Archive}
        format="pdf"
        onExport={handleInitialLoadPdf}
      />
    </div>
  )
}

/** @deprecated Use ExcelExports and PdfExports directly */
export function ReportsGrid() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-neutral-950 mb-4">
          Exportar a Excel
        </h2>
        <ExcelExports />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-neutral-950 mb-4">
          Reportes PDF
        </h2>
        <PdfExports />
      </div>
    </div>
  )
}
