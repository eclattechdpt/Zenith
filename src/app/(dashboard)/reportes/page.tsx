"use client"

import { FileSpreadsheet, FileText } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { SectionCard } from "@/components/shared/section-card"
import { ExcelExports, PdfExports } from "@/features/reportes/components/reports-grid"

export default function ReportesPage() {
  return (
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero title="Reportes y Exportaciones" />

      <SectionCard
        label="Exportar a Excel"
        description="Descarga datos en formato Excel para analisis"
        icon={FileSpreadsheet}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
        delay={0.08}
        className="bg-emerald-50/30 border-emerald-200/40"
      >
        <ExcelExports />
      </SectionCard>

      <SectionCard
        label="Reportes PDF"
        description="Reportes formateados listos para imprimir"
        icon={FileText}
        iconBg="bg-rose-100"
        iconColor="text-rose-500"
        delay={0.16}
        className="bg-rose-50/30 border-rose-200/40"
      >
        <PdfExports />
      </SectionCard>
    </div>
  )
}
