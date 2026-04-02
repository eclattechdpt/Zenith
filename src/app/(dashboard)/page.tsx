import { format } from "date-fns"
import { es } from "date-fns/locale"

import { createServerClient } from "@/lib/supabase/server"

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
import {
  fetchKpiData,
  fetchSalesChartData,
  fetchActivityFeed,
  fetchTopProducts,
  fetchInventoryAlerts,
} from "@/features/dashboard/queries"

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

  // Fetch all dashboard data in parallel
  const [kpiData, salesChart, activity, topProducts, inventoryAlerts] =
    await Promise.all([
      fetchKpiData(supabase),
      fetchSalesChartData(supabase),
      fetchActivityFeed(supabase),
      fetchTopProducts(supabase),
      fetchInventoryAlerts(supabase),
    ])

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
            <div className="max-w-full min-w-0 overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/40 p-4 shadow-sm sm:p-6 xl:col-span-3">
              <SalesChart
                totalMes={salesChart.totalMes}
                cambioMes={salesChart.cambioMes}
                semanas={salesChart.semanas}
              />
            </div>

            {/* Activity feed */}
            <ActivityFeed items={activity} />
          </div>
        </DashboardItem>

        {/* Top Products + Inventory Alerts */}
        <DashboardItem>
          <div className="grid min-w-0 gap-5 xl:grid-cols-2">
            <TopProductsGrid products={topProducts} />
            <InventoryAlertsGrid alerts={inventoryAlerts} />
          </div>
        </DashboardItem>
      </DashboardShell>
    </div>
  )
}
