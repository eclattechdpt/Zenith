"use client"

import { Suspense, useState } from "react"
import { FileText, ArrowRightLeft, CheckCircle2 } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { KpiCard } from "@/components/shared/kpi-card"
import { SectionCard } from "@/components/shared/section-card"
import { CreditNotesTable } from "@/features/notas-credito/components/credit-notes-table"
import { CreateCreditNoteDialog } from "@/features/notas-credito/components/create-credit-note-dialog"
import { useCreditNoteStats } from "@/features/notas-credito/queries"

export default function NotasCreditoPage() {
  const stats = useCreditNoteStats()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <Suspense>
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero
        title="Notas de Credito"
        ctaLabel="Nueva nota"
        onCta={() => setCreateOpen(true)}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <KpiCard
          title="Total notas"
          value={stats.total}
          subtitle="notas registradas"
          icon={FileText}
          variant="hero"
        />
        <KpiCard
          title="Prestamos activos"
          value={stats.activeLendings}
          subtitle="prestamos sin liquidar"
          icon={ArrowRightLeft}
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
          delay={0.06}
        />
        <KpiCard
          title="Liquidadas"
          value={stats.settled}
          subtitle="notas completadas"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          delay={0.12}
        />
      </div>

      {/* Credit notes table */}
      <SectionCard
        label="Registro"
        description="Prestamos e intercambios con distribuidores"
        icon={FileText}
        iconBg="bg-teal-50"
        iconColor="text-teal-500"
        delay={0.18}
      >
        <CreditNotesTable />
      </SectionCard>

      <CreateCreditNoteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
    </Suspense>
  )
}
