"use client"

import { AreaChart } from "@tremor/react"

import mockData from "../mock-data.json"

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(v)

export function SalesChart() {
  return (
    <AreaChart
      data={mockData.ventasSemana}
      index="dia"
      categories={["estaSemanaMXN", "semanaPasadaMXN"]}
      colors={["rose", "teal"]}
      valueFormatter={formatCurrency}
      showLegend={false}
      showGridLines={false}
      showYAxis={false}
      curveType="monotone"
      className="mt-6 h-[280px]"
    />
  )
}
