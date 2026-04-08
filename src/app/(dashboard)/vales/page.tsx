"use client"

import { Suspense } from "react"
import { Ticket, Clock, CheckCircle2, AlertCircle } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { KpiCard } from "@/components/shared/kpi-card"
import { ValesTable } from "@/features/vales/components/vales-table"
import { useValeStats } from "@/features/vales/queries"

export default function ValesPage() {
  const stats = useValeStats()

  return (
    <Suspense>
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero title="Vales" />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-5">
        <KpiCard
          title="Total vales"
          value={stats.total}
          subtitle={stats.cancelled > 0 ? `vales creados · ${stats.cancelled} cancelado${stats.cancelled !== 1 ? "s" : ""}` : "vales creados"}
          icon={Ticket}
          variant="hero"
        />
        <KpiCard
          title="Pendientes"
          value={stats.pending}
          subtitle="esperando stock"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          delay={0.06}
        />
        <KpiCard
          title="Listos"
          value={stats.ready}
          subtitle="para entregar"
          icon={AlertCircle}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          delay={0.12}
        />
        <KpiCard
          title="Completados"
          value={stats.completed}
          subtitle="entregados"
          icon={CheckCircle2}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          delay={0.18}
        />
      </div>

      {/* Vales table */}
      <ValesTable />
    </div>
    </Suspense>
  )
}
