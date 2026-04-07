"use client"

import { History } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { SectionCard } from "@/components/shared/section-card"
import { ReportsGrid } from "@/features/reportes/components/reports-grid"
import { ExportLog } from "@/features/reportes/components/export-log"

export default function ReportesPage() {
  return (
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero title="Reportes y Exportaciones" />

      <ReportsGrid />

      <SectionCard
        label="Historial de exportaciones"
        description="Registro de reportes descargados"
        icon={History}
        iconBg="bg-neutral-100"
        iconColor="text-neutral-500"
        delay={0.24}
      >
        <ExportLog />
      </SectionCard>
    </div>
  )
}
