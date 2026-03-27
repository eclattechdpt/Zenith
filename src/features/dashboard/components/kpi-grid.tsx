"use client"

import { formatCurrency } from "@/lib/utils"
import { KpiCard } from "./kpi-card"
import { MiniBarChart } from "./mini-bar-chart"
import { MiniSparkline } from "./mini-sparkline"
import { MiniProgressRing } from "./mini-progress-ring"
import { MiniProgressBar } from "./mini-progress-bar"

interface KpiData {
  ventasDelDia: number
  ventasDelDiaCambio: number
  productosVendidos: number
  productosVendidosCambio: number
  transacciones: number
  transaccionesCambio: number
  transaccionesMeta: number
  stockBajoAlertas: number
  ventasPor7Dias: number[]
  productosTendencia: number[]
}

export function KpiGrid({ data }: { data: KpiData }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <KpiCard
        label="Ventas del dia"
        value={data.ventasDelDia}
        formatValue={formatCurrency}
        change={`+${data.ventasDelDiaCambio}% vs ayer`}
        trend="up"
        gradient="from-rose-400 to-rose-600"
        hoverShadow="hover:shadow-[0_4px_20px_rgba(244,63,107,0.25)]"
      >
        <MiniBarChart data={data.ventasPor7Dias} />
      </KpiCard>

      <KpiCard
        label="Vendidos esta semana"
        value={data.productosVendidos}
        formatValue={(n) => n.toString()}
        change={`+${data.productosVendidosCambio} vs ayer`}
        trend="up"
        gradient="from-teal-400 to-teal-600"
        hoverShadow="hover:shadow-[0_4px_20px_rgba(37,166,182,0.20)]"
      >
        <MiniSparkline data={data.productosTendencia} />
      </KpiCard>

      <KpiCard
        label="Transacciones"
        value={data.transacciones}
        formatValue={(n) => n.toString()}
        change={`+${data.transaccionesCambio} vs ayer`}
        trend="up"
        gradient="from-blush-400 to-blush-600"
      >
        <MiniProgressRing value={data.transacciones} max={data.transaccionesMeta} />
      </KpiCard>

      <KpiCard
        label="Stock bajo"
        value={data.stockBajoAlertas}
        formatValue={(n) => n.toString()}
        change="alertas activas"
        trend="alert"
        gradient="from-neutral-700 to-neutral-900"
      >
        <MiniProgressBar value={data.stockBajoAlertas} max={15} />
      </KpiCard>
    </div>
  )
}
