import { createServerClient } from "@/lib/supabase/server"

import { PageHero } from "@/components/shared/page-hero"
import { QuickActions } from "@/features/dashboard/components/quick-actions"
import { DashboardContent } from "@/features/dashboard/components/dashboard-content"
import {
  fetchKpiData,
  fetchSalesChartData,
  fetchActivityFeed,
  fetchTopProducts,
  fetchInventoryAlerts,
} from "@/features/dashboard/queries"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos dias"
  if (hour < 19) return "Buenas tardes"
  return "Buenas noches"
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "usuario"

  const greeting = getGreeting()

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
    <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
      <PageHero
        title={`${greeting}, ${displayName}`}
        subtitle="Aqui va tu resumen del dia"
      />

      <QuickActions />

      <DashboardContent
        kpiData={kpiData}
        salesChart={salesChart}
        activity={activity}
        topProducts={topProducts}
        inventoryAlerts={inventoryAlerts}
      />
    </div>
  )
}
