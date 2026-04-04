"use client"

import { Users, Percent, UserX } from "lucide-react"

import { PageHero } from "@/components/shared/page-hero"
import { KpiCard } from "@/components/shared/kpi-card"
import { SectionCard } from "@/components/shared/section-card"
import { CustomerTable } from "@/features/clientes/components/customer-table"
import { useCustomerStats } from "@/features/clientes/queries"

export default function ClientesPage() {
  const stats = useCustomerStats()

  return (
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero
        title="Clientes"
        ctaLabel="Nuevo cliente"
        ctaHref="/clientes/nuevo"
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <KpiCard
          title="Total clientes"
          value={stats.total}
          subtitle="clientes registrados"
          icon={Users}
          variant="hero"
        />
        <KpiCard
          title="Con descuento"
          value={stats.withDiscount}
          subtitle="clientes con descuento"
          icon={Percent}
          iconBg="bg-teal-50"
          iconColor="text-teal-500"
          delay={0.06}
        />
        <KpiCard
          title="Sin descuento"
          value={stats.withoutDiscount}
          subtitle="precio regular"
          icon={UserX}
          iconBg="bg-neutral-100"
          iconColor="text-neutral-400"
          delay={0.12}
        />
      </div>

      {/* Customer table */}
      <SectionCard
        label="Directorio"
        description="Gestion de clientes y descuentos"
        icon={Users}
        iconBg="bg-teal-50"
        iconColor="text-teal-500"
        delay={0.18}
      >
        <CustomerTable />
      </SectionCard>
    </div>
  )
}
