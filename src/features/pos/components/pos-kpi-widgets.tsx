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
      bg: "bg-rose-50",
      border: "border-l-rose-500",
      textColor: "text-neutral-900",
      subColor: "text-neutral-500",
    },
    {
      label: "Productos vendidos",
      value: String(stats?.todayUnitsSold ?? 0),
      sub: "unidades hoy",
      bg: "bg-teal-50",
      border: "border-l-teal-500",
      textColor: "text-neutral-900",
      subColor: "text-neutral-500",
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(stats?.avgTicket ?? 0),
      sub: stats?.revenueVsYesterday
        ? `${stats.revenueVsYesterday > 0 ? "+" : ""}${Math.round(stats.revenueVsYesterday)}% vs ayer`
        : "",
      bg: "bg-blush-50",
      border: "border-l-blush-500",
      textColor: "text-neutral-900",
      subColor: "text-neutral-500",
    },
  ]

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`rounded-xl border-l-[3px] ${kpi.border} ${kpi.bg} p-4`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[2.5px] text-neutral-500">{kpi.label}</p>
          <p className={`font-display text-[28px] font-medium tracking-[-0.5px] ${kpi.textColor}`}>{kpi.value}</p>
          {kpi.sub && <p className={`text-xs font-medium ${kpi.subColor}`}>{kpi.sub}</p>}
        </motion.div>
      ))}
    </div>
  )
}
