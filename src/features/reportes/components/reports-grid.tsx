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

import { ExportCard, type ExportCardColor } from "./export-card"
import {
  exportSalesExcel,
  exportInventoryExcel,
  exportCustomersExcel,
  exportProductsExcel,
  exportTransitExcel,
  exportInitialLoadExcel,
} from "./excel-generators"

/* ── Color palettes per export card ── */

const COLORS = {
  rose: {
    cardBg: "bg-rose-50/40",
    cardBorder: "border-rose-200/50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(244,63,107,0.12)]",
    buttonClass: "bg-rose-500 text-white hover:bg-rose-600 border-0",
  },
  teal: {
    cardBg: "bg-teal-50/40",
    cardBorder: "border-teal-200/50",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(37,166,182,0.12)]",
    buttonClass: "bg-teal-500 text-white hover:bg-teal-600 border-0",
  },
  amber: {
    cardBg: "bg-amber-50/40",
    cardBorder: "border-amber-200/50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(245,158,11,0.12)]",
    buttonClass: "bg-amber-500 text-white hover:bg-amber-600 border-0",
  },
  violet: {
    cardBg: "bg-violet-50/40",
    cardBorder: "border-violet-200/50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(139,92,246,0.12)]",
    buttonClass: "bg-violet-500 text-white hover:bg-violet-600 border-0",
  },
  blush: {
    cardBg: "bg-pink-50/40",
    cardBorder: "border-pink-200/50",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(236,72,153,0.12)]",
    buttonClass: "bg-pink-500 text-white hover:bg-pink-600 border-0",
  },
  emerald: {
    cardBg: "bg-emerald-50/40",
    cardBorder: "border-emerald-200/50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(16,185,129,0.12)]",
    buttonClass: "bg-emerald-500 text-white hover:bg-emerald-600 border-0",
  },
} satisfies Record<string, ExportCardColor>

export function ExcelExports() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ExportCard
        title="Ventas"
        description="Historial completo de ventas con pagos y clientes"
        icon={Receipt}
        format="excel"
        color={COLORS.rose}
        delay={0.0}
        onExport={exportSalesExcel}
      />
      <ExportCard
        title="Inventario Fisico"
        description="Stock actual, minimo y estado por producto"
        icon={Package}
        format="excel"
        color={COLORS.teal}
        delay={0.04}
        onExport={exportInventoryExcel}
      />
      <ExportCard
        title="Inventario en Transito"
        description="Semanas de transito con productos y valores"
        icon={Truck}
        format="excel"
        color={COLORS.amber}
        delay={0.08}
        onExport={exportTransitExcel}
      />
      <ExportCard
        title="Inventario Carga Inicial"
        description="Stock inicial con precios y nombres editados"
        icon={Archive}
        format="excel"
        color={COLORS.violet}
        delay={0.12}
        onExport={exportInitialLoadExcel}
      />
      <ExportCard
        title="Clientes"
        description="Lista de clientes con datos de contacto"
        icon={Users}
        format="excel"
        color={COLORS.blush}
        delay={0.16}
        onExport={exportCustomersExcel}
      />
      <ExportCard
        title="Productos"
        description="Catalogo completo con variantes y precios"
        icon={ShoppingBag}
        format="excel"
        color={COLORS.emerald}
        delay={0.2}
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
        color={COLORS.rose}
        delay={0.0}
        onExport={handleSalesPdf}
      />
      <ExportCard
        title="Inventario Fisico"
        description="Stock actual con alertas y valor total"
        icon={Warehouse}
        format="pdf"
        color={COLORS.teal}
        delay={0.04}
        onExport={handleInventoryPdf}
      />
      <ExportCard
        title="Inventario en Transito"
        description="Semanas de transito con productos y valores"
        icon={Truck}
        format="pdf"
        color={COLORS.amber}
        delay={0.08}
        onExport={handleTransitPdf}
      />
      <ExportCard
        title="Inventario Carga Inicial"
        description="Stock inicial con precios editados y valor total"
        icon={Archive}
        format="pdf"
        color={COLORS.violet}
        delay={0.12}
        onExport={handleInitialLoadPdf}
      />
    </div>
  )
}
