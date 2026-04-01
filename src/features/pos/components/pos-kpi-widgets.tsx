"use client"

import { motion } from "motion/react"
import { formatCurrency } from "@/lib/utils"
import { usePOSDashboardStats } from "../queries"

export function POSKpiWidgets() {
  const { data: stats } = usePOSDashboardStats()

  const kpis = [
    {
      label: "Ventas hoy",
      value: formatCurrency(stats?.todayRevenue ?? 0),
      sub: `${stats?.todayTransactions ?? 0} transacciones`,
      gradient: "from-rose-50 to-rose-100",
      textColor: "text-rose-900",
      labelColor: "text-rose-700",
      subColor: "text-rose-500",
    },
    {
      label: "Productos vendidos",
      value: String(stats?.todayUnitsSold ?? 0),
      sub: "unidades hoy",
      gradient: "from-teal-50 to-teal-100",
      textColor: "text-teal-900",
      labelColor: "text-teal-700",
      subColor: "text-teal-600",
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(stats?.avgTicket ?? 0),
      sub: stats?.revenueVsYesterday
        ? `${stats.revenueVsYesterday > 0 ? "+" : ""}${Math.round(stats.revenueVsYesterday)}% vs ayer`
        : "—",
      gradient: "from-amber-50 to-amber-100",
      textColor: "text-amber-900",
      labelColor: "text-amber-700",
      subColor: "text-amber-600",
    },
  ]

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`rounded-xl bg-gradient-to-br ${kpi.gradient} p-4`}
        >
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${kpi.labelColor}`}>{kpi.label}</p>
          <p className={`text-2xl font-extrabold ${kpi.textColor}`}>{kpi.value}</p>
          <p className={`text-xs ${kpi.subColor}`}>{kpi.sub}</p>
        </motion.div>
      ))}
    </div>
  )
}
