"use client"

import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { useDashboardData } from "../queries"

export function DashboardHeroSubtitle() {
  const { data, isPending } = useDashboardData()

  if (isPending || !data) {
    return <span className="text-neutral-400">Cargando tu resumen…</span>
  }

  const { ventasDelDiaCambio, transacciones } = data.kpiData
  const isUp = ventasDelDiaCambio >= 0
  const pillBg = isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
  const Arrow = isUp ? ArrowUpRight : ArrowDownRight
  const sign = isUp ? "+" : ""

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[12px] font-semibold ${pillBg}`}
      >
        <Arrow className="h-3 w-3" />
        {sign}
        {ventasDelDiaCambio}% vs ayer
      </span>
      <span className="text-accent-500">•</span>
      <span className="text-neutral-500">
        {transacciones} {transacciones === 1 ? "transacción" : "transacciones"} hoy
      </span>
    </span>
  )
}
