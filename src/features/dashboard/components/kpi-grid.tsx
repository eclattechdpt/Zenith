"use client"

import {
  DollarSign,
  Package,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { KpiCard } from "./kpi-card"
import { SalesProgress } from "./mini-bar-chart"
import { WeeklyBarChart } from "./mini-sparkline"
import { PaymentBreakdown } from "./mini-progress-ring"
import { InventoryHealth } from "./mini-progress-bar"

interface KpiData {
  ventasDelDia: number
  ventasDelDiaCambio: number
  ventasAyer: number
  ventasMaxDia: number
  productosVendidos: number
  productosVendidosCambio: number
  vendidosPorDia: number[]
  vendidosDias: string[]
  vendidosDiaActual: number
  transacciones: number
  transaccionesCambio: number
  pagoTarjeta: number
  pagoEfectivo: number
  pagoTransferencia: number
  stockBajoAlertas: number
  inventarioOk: number
  inventarioBajo: number
  inventarioCritico: number
}

export function KpiGrid({ data }: { data: KpiData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Rose — Ventas del dia */}
      <KpiCard
        label="Ventas del dia"
        value={data.ventasDelDia}
        formatValue={formatCurrency}
        change={`+${data.ventasDelDiaCambio}% vs ayer`}
        trend="up"
        icon={DollarSign}
        bg="from-rose-50 to-rose-100"
        borderColor="#FFE0E8"
        labelColor="#E11D52"
        numberColor="#9D1139"
        iconBg="rgba(244,63,107,0.12)"
        iconColor="#F43F6B"
        pillBg="rgba(244,63,107,0.15)"
        pillText="#E11D52"
      >
        <SalesProgress
          today={data.ventasDelDia}
          yesterday={data.ventasAyer}
          max={data.ventasMaxDia}
        />
      </KpiCard>

      {/* Teal — Vendidos esta semana */}
      <KpiCard
        label="Vendidos esta semana"
        value={data.productosVendidos}
        formatValue={(n) => n.toString()}
        change={`+${data.productosVendidosCambio} vs ayer`}
        trend="up"
        icon={Package}
        bg="from-teal-50 to-teal-100"
        borderColor="#D6F6F8"
        labelColor="#236C7D"
        numberColor="#255867"
        iconBg="rgba(37,166,182,0.12)"
        iconColor="#25A6B6"
        pillBg="rgba(37,166,182,0.15)"
        pillText="#236C7D"
      >
        <WeeklyBarChart
          data={data.vendidosPorDia}
          labels={data.vendidosDias}
          currentDayIndex={data.vendidosDiaActual}
        />
      </KpiCard>

      {/* Blush — Transacciones */}
      <KpiCard
        label="Transacciones"
        value={data.transacciones}
        formatValue={(n) => n.toString()}
        change={`+${data.transaccionesCambio} vs ayer`}
        trend="up"
        icon={ShoppingBag}
        bg="from-blush-50 to-blush-100"
        borderColor="#FFDDE3"
        labelColor="#C45E78"
        numberColor="#9E4A60"
        iconBg="rgba(255,150,174,0.12)"
        iconColor="#FF96AE"
        pillBg="rgba(255,150,174,0.15)"
        pillText="#C45E78"
      >
        <PaymentBreakdown
          methods={[
            { label: "Tarjeta", count: data.pagoTarjeta, dotColor: "#E87A95" },
            { label: "Efectivo", count: data.pagoEfectivo, dotColor: "#FF96AE" },
            { label: "Transf.", count: data.pagoTransferencia, dotColor: "#FFC4CF" },
          ]}
        />
      </KpiCard>

      {/* Warning — Stock bajo */}
      <KpiCard
        label="Stock bajo"
        value={data.stockBajoAlertas}
        formatValue={(n) => n.toString()}
        change="alertas activas"
        trend="alert"
        icon={AlertTriangle}
        bg="from-[#FEFCE8] to-[#FEF9C3]"
        borderColor="rgba(202,138,4,0.25)"
        labelColor="#854D0E"
        numberColor="#854D0E"
        iconBg="rgba(202,138,4,0.12)"
        iconColor="#CA8A04"
        pillBg="rgba(202,138,4,0.15)"
        pillText="#854D0E"
      >
        <InventoryHealth
          ok={data.inventarioOk}
          bajo={data.inventarioBajo}
          critico={data.inventarioCritico}
        />
      </KpiCard>
    </div>
  )
}
