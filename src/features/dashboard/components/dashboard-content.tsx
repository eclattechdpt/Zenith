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
        {/* KPI Grid — hero anchor + 3 secondary */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          <KpiCard
            variant="hero"
            heroGradient="from-rose-500 to-rose-600"
            heroShadow="shadow-rose-500/15"
            delay={0}
            title="Ventas del dia"
            value={kpiData.ventasDelDia}
            format={formatCurrency}
            subtitle="hoy"
            icon={DollarSign}
            badge={{
              label: `+${kpiData.ventasDelDiaCambio}% vs ayer`,
              trend: "up",
            }}
          >
            <SalesProgress
              today={kpiData.ventasDelDia}
              yesterday={kpiData.ventasAyer}
              max={kpiData.ventasMaxDia}
              variant="dark"
            />
          </KpiCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            <KpiCard
              title="Vendidos esta semana"
              value={kpiData.productosVendidos}
              subtitle="productos"
              icon={Package}
              iconBg="bg-teal-50"
              iconColor="text-teal-500"
              ringColor="border-teal-100/70"
              ringAnchor="tr"
              badge={{
                label: `+${kpiData.productosVendidosCambio} vs ayer`,
                trend: "up",
              }}
              delay={0.18}
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
              iconColor="text-blush-500"
              ringColor="border-blush-100/70"
              ringAnchor="tr"
              badge={{
                label: `+${kpiData.transaccionesCambio} vs ayer`,
                trend: "up",
              }}
              delay={0.26}
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
              ringColor="border-amber-100/70"
              ringAnchor="bl"
              badge={{
                label: `${kpiData.stockBajoAlertas} alertas`,
                trend: "neutral",
              }}
              delay={0.34}
            >
              <InventoryHealth
                ok={kpiData.inventarioOk}
                bajo={kpiData.inventarioBajo}
                critico={kpiData.inventarioCritico}
              />
            </KpiCard>
          </div>
        </div>

        {/* Sales Chart + Top Products */}
        <div className="grid min-w-0 gap-5 xl:grid-cols-5">
          <SectionCard
            label="Rendimiento de ventas"
            icon={TrendingUp}
            iconBg="bg-rose-100"
            iconColor="text-rose-500"
            tint="rose"
            delay={0.42}
            className="xl:col-span-3"
          >
            <SalesChart
              totalMes={salesChart.totalMes}
              cambioMes={salesChart.cambioMes}
              semanas={salesChart.semanas}
            />
          </SectionCard>

          <SectionCard
            label="Productos mas vendidos"
            description="Este mes"
            icon={Award}
            iconBg="bg-teal-100"
            iconColor="text-teal-600"
            tint="teal"
            delay={0.48}
            className="xl:col-span-2"
          >
            <TopProductsGrid products={topProducts!.slice(0, 3)} />
          </SectionCard>
        </div>

        {/* Activity Feed + Inventory Alerts */}
        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <SectionCard
            label="Actividad reciente"
            description="Hoy"
            icon={Activity}
            iconBg="bg-blush-100"
            iconColor="text-blush-600"
            tint="blush"
            delay={0.54}
          >
            <ActivityFeed items={activity!} />
          </SectionCard>

          <SectionCard
            label="Alertas de inventario"
            description={`${inventoryAlerts.length} alertas`}
            icon={AlertTriangle}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            tint="amber"
            delay={0.60}
          >
            <InventoryAlertsGrid alerts={inventoryAlerts} />
          </SectionCard>
        </div>
      </div>
  )
}
