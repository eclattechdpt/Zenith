"use client"

import { Receipt, DollarSign, TrendingUp } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { KpiCard } from "@/components/shared/kpi-card"
import { SectionCard } from "@/components/shared/section-card"
import { SalesTable } from "@/features/ventas/components/sales-table"
import { useSalesStats } from "@/features/ventas/queries"
import { formatCurrency } from "@/lib/utils"

export default function VentasPage() {
  const stats = useSalesStats()

  return (
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero title="Ventas y Cotizaciones" />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <KpiCard
          title="Total ventas"
          value={stats.totalSales}
          subtitle="ventas completadas"
          icon={Receipt}
          variant="hero"
        />
        <KpiCard
          title="Ingresos"
          value={stats.totalRevenue}
          subtitle="ingresos totales"
          icon={DollarSign}
          format={formatCurrency}
          iconBg="bg-teal-50"
          iconColor="text-teal-500"
          delay={0.06}
        />
        <KpiCard
          title="Ticket promedio"
          value={stats.averageTicket}
          subtitle="por venta"
          icon={TrendingUp}
          format={formatCurrency}
          iconBg="bg-blush-50"
          iconColor="text-rose-400"
          delay={0.12}
        />
      </div>

      {/* Sales table */}
      <SectionCard
        label="Historial"
        description="Historial de ventas y gestion de cotizaciones"
        icon={Receipt}
        iconBg="bg-rose-50"
        iconColor="text-rose-400"
        delay={0.18}
      >
        <SalesTable />
      </SectionCard>
    </div>
  )
}
