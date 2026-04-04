"use client"

import { FileText, Wallet, CheckCircle2 } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { KpiCard } from "@/components/shared/kpi-card"
import { SectionCard } from "@/components/shared/section-card"
import { CreditNotesTable } from "@/features/notas-credito/components/credit-notes-table"
import { useCreditNoteStats } from "@/features/notas-credito/queries"
import { formatCurrency } from "@/lib/utils"

export default function NotasCreditoPage() {
  const stats = useCreditNoteStats()

  return (
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero title="Notas de Credito" />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <KpiCard
          title="Total notas"
          value={stats.total}
          subtitle="notas generadas"
          icon={FileText}
          variant="hero"
        />
        <KpiCard
          title="Saldo activo"
          value={stats.activeBalance}
          subtitle={`${stats.active} nota${stats.active !== 1 ? "s" : ""} activa${stats.active !== 1 ? "s" : ""}`}
          icon={Wallet}
          format={formatCurrency}
          iconBg="bg-teal-50"
          iconColor="text-teal-500"
          delay={0.06}
        />
        <KpiCard
          title="Aplicadas"
          value={stats.applied}
          subtitle="notas redimidas"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          delay={0.12}
        />
      </div>

      {/* Credit notes table */}
      <SectionCard
        label="Registro"
        description="Notas de credito generadas por devoluciones"
        icon={FileText}
        iconBg="bg-teal-50"
        iconColor="text-teal-500"
        delay={0.18}
      >
        <CreditNotesTable />
      </SectionCard>
    </div>
  )
}
