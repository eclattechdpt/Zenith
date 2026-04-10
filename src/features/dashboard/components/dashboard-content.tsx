"use client"

import {
  DollarSign,
  Package,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Activity,
  Award,
} from "lucide-react"

import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

import { formatCurrency } from "@/lib/utils"
import { KpiCard } from "@/components/shared/kpi-card"
import { SectionCard } from "@/components/shared/section-card"

import { useDashboardData } from "../queries"
import { DashboardFixture } from "./fixtures/dashboard-fixture"
import { SalesProgress } from "./mini-bar-chart"
import { WeeklyBarChart } from "./mini-sparkline"
import { PaymentBreakdown } from "./mini-progress-ring"
import { InventoryHealth } from "./mini-progress-bar"
import { SalesChart } from "./sales-chart"
import { ActivityFeed } from "./activity-feed"
import { TopProductsGrid } from "./top-products-grid"
import { InventoryAlertsGrid } from "./inventory-alerts-grid"

export function DashboardContent() {
  const { data, isPending } = useDashboardData()

  return (
    <BoneyardSkeleton
      name="dashboard-full"
      loading={isPending || !data}
      animate="shimmer"
      fixture={<DashboardFixture />}
    >
      {data && <DashboardInner data={data} />}
    </BoneyardSkeleton>
  )
}

function DashboardInner({ data }: { data: NonNullable<ReturnType<typeof useDashboardData>["data"]> }) {
  const { kpiData, salesChart, activity, topProducts, inventoryAlerts } = data

  return (
    <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          <KpiCard
            title="Ventas del dia"
            value={kpiData.ventasDelDia}
            format={formatCurrency}
            subtitle="hoy"
            icon={DollarSign}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            badge={{
              label: `+${kpiData.ventasDelDiaCambio}% vs ayer`,
              trend: "up",
            }}
          >
            <SalesProgress
              today={kpiData.ventasDelDia}
              yesterday={kpiData.ventasAyer}
              max={kpiData.ventasMaxDia}
            />
          </KpiCard>

          <KpiCard
            title="Vendidos esta semana"
            value={kpiData.productosVendidos}
            subtitle="productos"
            icon={Package}
            iconBg="bg-teal-50"
            iconColor="text-teal-500"
            badge={{
              label: `+${kpiData.productosVendidosCambio} vs ayer`,
              trend: "up",
            }}
            delay={0.06}
          >
            <WeeklyBarChart
              data={kpiData.vendidosPorDia}
              labels={kpiData.vendidosDias}
              currentDayIndex={kpiData.vendidosDiaActual}
            />
          </KpiCard>

          <KpiCard
            title="Transacciones"
            value={kpiData.transacciones}
            subtitle="operaciones"
            icon={ShoppingBag}
            iconBg="bg-blush-50"
            iconColor="text-rose-400"
            badge={{
              label: `+${kpiData.transaccionesCambio} vs ayer`,
              trend: "up",
            }}
            delay={0.12}
          >
            <PaymentBreakdown
              methods={[
                { label: "Tarjeta", count: kpiData.pagoTarjeta, dotColor: "#E87A95" },
                { label: "Efectivo", count: kpiData.pagoEfectivo, dotColor: "#FF96AE" },
                { label: "Transf.", count: kpiData.pagoTransferencia, dotColor: "#FFC4CF" },
              ]}
            />
          </KpiCard>

          <KpiCard
            title="Stock bajo"
            value={kpiData.stockBajoAlertas}
            subtitle="alertas activas"
            icon={AlertTriangle}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            badge={{
              label: `${kpiData.stockBajoAlertas} alertas`,
              trend: "neutral",
            }}
            delay={0.18}
          >
            <InventoryHealth
              ok={kpiData.inventarioOk}
              bajo={kpiData.inventarioBajo}
              critico={kpiData.inventarioCritico}
            />
          </KpiCard>
        </div>

        {/* Sales Chart + Activity Feed */}
        <div className="grid min-w-0 gap-5 xl:grid-cols-5">
          <SectionCard
            label="Rendimiento de ventas"
            icon={TrendingUp}
            iconBg="bg-rose-50"
            iconColor="text-rose-400"
            delay={0.24}
            className="xl:col-span-3"
          >
            <SalesChart
              totalMes={salesChart.totalMes}
              cambioMes={salesChart.cambioMes}
              semanas={salesChart.semanas}
            />
          </SectionCard>

          <SectionCard
            label="Actividad reciente"
            description="Hoy"
            icon={Activity}
            iconBg="bg-blush-50"
            iconColor="text-blush-500"
            delay={0.30}
            className="xl:col-span-2"
          >
            <ActivityFeed items={activity!} />
          </SectionCard>
        </div>

        {/* Top Products + Inventory Alerts */}
        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <SectionCard
            label="Productos mas vendidos"
            description="Este mes"
            icon={Award}
            iconBg="bg-teal-50"
            iconColor="text-teal-500"
            delay={0.36}
          >
            <TopProductsGrid products={topProducts!} />
          </SectionCard>

          <SectionCard
            label="Alertas de inventario"
            description={`${inventoryAlerts.length} alertas`}
            icon={AlertTriangle}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            delay={0.42}
          >
            <InventoryAlertsGrid alerts={inventoryAlerts} />
          </SectionCard>
        </div>
      </div>
  )
}
