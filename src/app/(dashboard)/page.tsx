import { format } from "date-fns"
import { es } from "date-fns/locale"

import { createServerClient } from "@/lib/supabase/server"
import mockData from "@/features/dashboard/mock-data.json"

import { GreetingSection } from "@/features/dashboard/components/greeting-section"
import { QuickActions } from "@/features/dashboard/components/quick-actions"
import { KpiGrid } from "@/features/dashboard/components/kpi-grid"
import { SalesChart } from "@/features/dashboard/components/sales-chart"
import { ActivityFeed } from "@/features/dashboard/components/activity-feed"
import { TopProductsGrid } from "@/features/dashboard/components/top-products-grid"
import { InventoryAlertsGrid } from "@/features/dashboard/components/inventory-alerts-grid"
import {
  DashboardShell,
  DashboardItem,
} from "@/features/dashboard/components/dashboard-shell"

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "usuario"

  const today = new Date()
  const formattedDate = format(today, "d 'de' MMMM, yyyy", { locale: es })

  const kpiData = {
    ventasDelDia: mockData.kpis.ventasDelDia,
    ventasDelDiaCambio: mockData.kpis.ventasDelDiaCambio,
    ventasAyer: mockData.kpis.ventasAyer,
    ventasMaxDia: mockData.kpis.ventasMaxDia,
    productosVendidos: mockData.kpis.productosVendidos,
    productosVendidosCambio: mockData.kpis.productosVendidosCambio,
    vendidosPorDia: mockData.kpis.vendidosPorDia,
    vendidosDias: mockData.kpis.vendidosDias,
    vendidosDiaActual: mockData.kpis.vendidosDiaActual,
    transacciones: mockData.kpis.transacciones,
    transaccionesCambio: mockData.kpis.transaccionesCambio,
    pagoTarjeta: mockData.kpis.pagoTarjeta,
    pagoEfectivo: mockData.kpis.pagoEfectivo,
    pagoTransferencia: mockData.kpis.pagoTransferencia,
    stockBajoAlertas: mockData.kpis.stockBajoAlertas,
    inventarioOk: mockData.kpis.inventarioOk,
    inventarioBajo: mockData.kpis.inventarioBajo,
    inventarioCritico: mockData.kpis.inventarioCritico,
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <GreetingSection
        displayName={displayName}
        formattedDate={formattedDate}
      />

      {/* Quick Actions — THE STAR */}
      <QuickActions />

      {/* Animated sections */}
      <DashboardShell>
        {/* KPI Cards */}
        <DashboardItem>
          <KpiGrid data={kpiData} />
        </DashboardItem>

        {/* Chart + Activity */}
        <DashboardItem>
          <div className="grid min-w-0 gap-5 xl:grid-cols-5">
            {/* Sales chart */}
            <div className="min-w-0 overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/40 p-4 shadow-sm transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(244,63,107,0.10)] sm:p-6 xl:col-span-3">
              <SalesChart
                totalMes={mockData.ventasMensuales.totalMes}
                cambioMes={mockData.ventasMensuales.cambioMes}
                semanas={mockData.ventasMensuales.semanas}
              />
            </div>

            {/* Activity feed */}
            <ActivityFeed items={mockData.actividadReciente} />
          </div>
        </DashboardItem>

        {/* Top Products + Inventory Alerts */}
        <DashboardItem>
          <div className="grid min-w-0 gap-5 xl:grid-cols-2">
            <TopProductsGrid products={mockData.topProductos} />
            <InventoryAlertsGrid alerts={mockData.alertasInventario} />
          </div>
        </DashboardItem>
      </DashboardShell>
    </div>
  )
}
