"use client"

import { useQuery } from "@tanstack/react-query"
import { format, getDate, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

import { createClient } from "@/lib/supabase/client"
import type { InventoryAlert } from "./components/inventory-alerts-grid"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

// ── Types matching existing component interfaces ──

export interface KpiData {
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

export interface WeekData {
  label: string
  rango: string
  total: number
  enProgreso?: boolean
}

export interface SalesChartData {
  totalMes: number
  cambioMes: number
  semanas: WeekData[]
}

export interface ActivityItem {
  id: string
  tipo: string
  descripcion: string
  detalle: string
  monto: number | null
  hora: string
}

export interface TopProduct {
  nombre: string
  variante: string
  unidades: number
  ingresos: number
  margen: number
}

export interface DashboardData {
  kpiData: KpiData
  salesChart: SalesChartData
  activity: ActivityItem[]
  topProducts: TopProduct[]
  inventoryAlerts: InventoryAlert[]
}

// ── Payment labels ──

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  credit_note: "Nota de credito",
  other: "Otro",
}

// ── RPC raw types ──

interface RawDashboardData {
  kpi: {
    today_revenue: number
    today_count: number
    today_units: number
    today_payments: { cash: number; card: number; transfer: number }
  }
  kpi_yesterday: {
    yesterday_revenue: number
    yesterday_count: number
    yesterday_units: number
  }
  kpi_weekly_units: { dow: number; units: number }[]
  kpi_inventory: { ok: number; bajo: number; critico: number }
  sales_chart: {
    current_month: { total: number; weeks: { bucket: number; total: number }[] }
    previous_month_total: number
  }
  activity: {
    sales: {
      id: string
      sale_number: string
      total: number
      created_at: string
      status: string
      customer_name: string | null
      item_count: number
      methods: string[]
    }[]
    returns: {
      id: string
      return_number: string
      total_refund: number
      created_at: string
      status: string
      sale_number: string | null
    }[]
    vales: {
      id: string
      vale_number: string
      total: number
      created_at: string
      status: string
      customer_name: string | null
    }[]
    credit_notes: {
      id: string
      credit_note_number: string
      total: number
      created_at: string
      status: string
      credit_type: string
      customer_name: string | null
    }[]
    exports: {
      id: string
      report_name: string
      format: string
      created_at: string
    }[]
  }
  top_products: TopProduct[]
  inventory_alerts: {
    nombre: string
    variante: string
    stock_actual: number
    stock_minimo: number
    estado: "critico" | "bajo"
    deficit: number
  }[]
  current_day_index: number
  today_date: number
  month_end_date: number
}

// ── Transform RPC JSON → TypeScript interfaces ──

function transformDashboardData(raw: RawDashboardData): DashboardData {
  const now = new Date()

  // ── KPI (null-safe — subqueries can return null for empty sets) ──
  const kpi = raw.kpi ?? { today_revenue: 0, today_count: 0, today_units: 0, today_payments: { cash: 0, card: 0, transfer: 0 } }
  const kpiY = raw.kpi_yesterday ?? { yesterday_revenue: 0, yesterday_count: 0, yesterday_units: 0 }

  const todayRev = Number(kpi.today_revenue)
  const yesterdayRev = Number(kpiY.yesterday_revenue)
  const todayUnits = Number(kpi.today_units)
  const yesterdayUnits = Number(kpiY.yesterday_units)
  const todayCount = Number(kpi.today_count)
  const yesterdayCount = Number(kpiY.yesterday_count)

  const ventasDelDiaCambio =
    yesterdayRev > 0
      ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 1000) / 10
      : todayRev > 0
        ? 100
        : 0

  // Weekly units array (Mon=0 .. Sun=6)
  const vendidosPorDia = [0, 0, 0, 0, 0, 0, 0]
  for (const d of raw.kpi_weekly_units) {
    // dow from ISODOW: 1=Mon..7=Sun → index 0..6
    const idx = d.dow - 1
    if (idx >= 0 && idx < 7) vendidosPorDia[idx] = Number(d.units)
  }

  const inv = raw.kpi_inventory
  const inventarioOk = Number(inv.ok)
  const inventarioBajo = Number(inv.bajo)
  const inventarioCritico = Number(inv.critico)

  const kpiData: KpiData = {
    ventasDelDia: todayRev,
    ventasDelDiaCambio,
    ventasAyer: yesterdayRev,
    ventasMaxDia: Math.max(todayRev, yesterdayRev, 1),
    productosVendidos: todayUnits,
    productosVendidosCambio: todayUnits - yesterdayUnits,
    vendidosPorDia,
    vendidosDias: ["L", "M", "X", "J", "V", "S", "D"],
    vendidosDiaActual: raw.current_day_index,
    transacciones: todayCount,
    transaccionesCambio: todayCount - yesterdayCount,
    pagoTarjeta: Number(kpi.today_payments?.card ?? 0),
    pagoEfectivo: Number(kpi.today_payments?.cash ?? 0),
    pagoTransferencia: Number(kpi.today_payments?.transfer ?? 0),
    stockBajoAlertas: inventarioBajo + inventarioCritico,
    inventarioOk,
    inventarioBajo,
    inventarioCritico,
  }

  // ── Sales Chart ──
  const sc = raw.sales_chart ?? { current_month: { total: 0, weeks: [] }, previous_month_total: 0 }
  const cm = sc.current_month ?? { total: 0, weeks: [] }
  const totalMes = Number(cm.total)
  const totalPrev = Number(sc.previous_month_total)
  const cambioMes =
    totalPrev > 0
      ? Math.round(((totalMes - totalPrev) / totalPrev) * 1000) / 10
      : totalMes > 0
        ? 100
        : 0

  const todayDate = raw.today_date
  const monthEndDate = raw.month_end_date
  const monthName = format(now, "MMM", { locale: es })

  const WEEK_RANGES = [
    { start: 1, end: 7 },
    { start: 8, end: 14 },
    { start: 15, end: 21 },
    { start: 22, end: 31 },
  ]

  // Build a bucket map from the RPC result
  const bucketTotals = new Map<number, number>()
  for (const w of cm.weeks) {
    bucketTotals.set(w.bucket, Number(w.total))
  }

  const semanas: WeekData[] = WEEK_RANGES
    .filter((b) => b.start <= todayDate || (bucketTotals.get(WEEK_RANGES.indexOf(b) + 1) ?? 0) > 0)
    .map((b, i, arr) => {
      const bucketIdx = WEEK_RANGES.indexOf(b) + 1
      const isLast = i === arr.length - 1
      const endDay = Math.min(b.end, isLast ? monthEndDate : b.end)
      return {
        label: isLast && b.start <= todayDate ? "Esta sem." : `Sem ${i + 1}`,
        rango: `${monthName} ${b.start}-${endDay}`,
        total: Math.round((bucketTotals.get(bucketIdx) ?? 0) * 100) / 100,
        enProgreso: todayDate >= b.start && todayDate <= b.end,
      }
    })

  const salesChart: SalesChartData = { totalMes, cambioMes, semanas }

  // ── Activity Feed ──
  const act = raw.activity ?? { sales: [], returns: [], vales: [], credit_notes: [], exports: [] }
  const activityItems: ActivityItem[] = []

  for (const s of act.sales ?? []) {
    const uniqueMethods = [...new Set(s.methods ?? [])]
    const methodLabel = uniqueMethods
      .map((m) => PAYMENT_LABELS[m] ?? m)
      .join(", ")

    if (s.status === "cancelled") {
      activityItems.push({
        id: s.id,
        tipo: "cancelacion",
        descripcion: `Cancelada ${s.sale_number}`,
        detalle: s.customer_name ?? "Sin cliente",
        monto: -Number(s.total),
        hora: format(new Date(s.created_at), "HH:mm"),
      })
    } else if (s.status === "pending") {
      activityItems.push({
        id: s.id,
        tipo: "pendiente",
        descripcion: `Pendiente ${s.sale_number}`,
        detalle: `${s.item_count} producto${s.item_count !== 1 ? "s" : ""} — Pendiente de cobro`,
        monto: Number(s.total),
        hora: format(new Date(s.created_at), "HH:mm"),
      })
    } else {
      activityItems.push({
        id: s.id,
        tipo: "venta",
        descripcion: `Venta ${s.sale_number}`,
        detalle: `${s.item_count} producto${s.item_count !== 1 ? "s" : ""} — ${methodLabel || "Sin pago"}`,
        monto: Number(s.total),
        hora: format(new Date(s.created_at), "HH:mm"),
      })
    }
  }

  for (const r of act.returns ?? []) {
    activityItems.push({
      id: r.id,
      tipo: r.status === "cancelled" ? "cancelacion" : "devolucion",
      descripcion: r.status === "cancelled"
        ? `Dev. cancelada ${r.return_number}`
        : `Devolucion ${r.return_number}`,
      detalle: r.sale_number ? `De venta ${r.sale_number}` : "Devolucion",
      monto: -Number(r.total_refund),
      hora: format(new Date(r.created_at), "HH:mm"),
    })
  }

  for (const v of act.vales ?? []) {
    activityItems.push({
      id: v.id,
      tipo: v.status === "completed" ? "vale_completado" : v.status === "cancelled" ? "cancelacion" : "vale",
      descripcion: v.status === "completed"
        ? `Vale entregado ${v.vale_number}`
        : v.status === "cancelled"
          ? `Vale cancelado ${v.vale_number}`
          : `Vale ${v.vale_number}`,
      detalle: v.customer_name ?? "Sin cliente",
      monto: Number(v.total),
      hora: format(new Date(v.created_at), "HH:mm"),
    })
  }

  for (const cn of act.credit_notes ?? []) {
    const typeLabel = cn.credit_type === "lending" ? "Prestamo" : "Intercambio"
    activityItems.push({
      id: cn.id,
      tipo: cn.status === "settled" ? "nota_liquidada" : cn.status === "cancelled" ? "cancelacion" : "nota_credito",
      descripcion: cn.status === "settled"
        ? `Liquidada ${cn.credit_note_number}`
        : cn.status === "cancelled"
          ? `NC cancelada ${cn.credit_note_number}`
          : `${typeLabel} ${cn.credit_note_number}`,
      detalle: cn.customer_name ?? "Sin cliente",
      monto: Number(cn.total),
      hora: format(new Date(cn.created_at), "HH:mm"),
    })
  }

  for (const e of act.exports ?? []) {
    activityItems.push({
      id: e.id,
      tipo: "exportacion",
      descripcion: `${e.report_name}`,
      detalle: e.format.toUpperCase(),
      monto: null,
      hora: format(new Date(e.created_at), "HH:mm"),
    })
  }

  // Sort by time DESC, take first 4
  activityItems.sort(
    (a, b) =>
      new Date(`2000-01-01T${b.hora}`).getTime() -
      new Date(`2000-01-01T${a.hora}`).getTime()
  )

  // ── Top Products ──
  const topProducts: TopProduct[] = (raw.top_products ?? []).map((tp) => ({
    nombre: tp.nombre,
    variante: tp.variante ?? tp.nombre,
    unidades: Number(tp.unidades),
    ingresos: Number(tp.ingresos),
    margen: Number(tp.margen),
  }))

  // ── Inventory Alerts ──
  const inventoryAlerts: InventoryAlert[] = (raw.inventory_alerts ?? []).map(
    (ia) => ({
      nombre: ia.nombre,
      variante: ia.variante,
      stockActual: Number(ia.stock_actual),
      stockMinimo: Number(ia.stock_minimo),
      estado: ia.estado,
    })
  )

  return {
    kpiData,
    salesChart,
    activity: activityItems.slice(0, 4),
    topProducts,
    inventoryAlerts,
  }
}

// ── Client-side hook ──

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "get_dashboard_data",
        { p_tenant_id: TENANT_ID }
      )

      if (error) throw error

      // Supabase RPC may return JSON as string or parsed object
      const parsed =
        typeof data === "string" ? JSON.parse(data) : data

      return transformDashboardData(parsed as RawDashboardData)
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
