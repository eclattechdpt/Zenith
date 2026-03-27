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
    productosVendidos: mockData.kpis.productosVendidos,
    productosVendidosCambio: mockData.kpis.productosVendidosCambio,
    transacciones: mockData.kpis.transacciones,
    transaccionesCambio: mockData.kpis.transaccionesCambio,
    transaccionesMeta: mockData.kpis.transaccionesMeta,
    stockBajoAlertas: mockData.kpis.stockBajoAlertas,
    ventasPor7Dias: mockData.kpis.ventasPor7Dias,
    productosTendencia: mockData.kpis.productosTendencia,
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
          <div className="grid gap-5 xl:grid-cols-5">
            {/* Sales chart */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md xl:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">
                    Rendimiento de ventas
                  </h2>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    Comparativa semanal
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-400" />
                    <span className="text-[11px] font-medium text-neutral-500">
                      Esta semana
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-teal-300" />
                    <span className="text-[11px] font-medium text-neutral-500">
                      Semana pasada
                    </span>
                  </div>
                </div>
              </div>
              <SalesChart />
            </div>

            {/* Activity feed */}
            <ActivityFeed items={mockData.actividadReciente} />
          </div>
        </DashboardItem>

        {/* Top Products + Inventory Alerts */}
        <DashboardItem>
          <div className="grid gap-5 xl:grid-cols-2">
            <TopProductsGrid products={mockData.topProductos} />
            <InventoryAlertsGrid alerts={mockData.alertasInventario} />
          </div>
        </DashboardItem>
      </DashboardShell>
    </div>
  )
}
