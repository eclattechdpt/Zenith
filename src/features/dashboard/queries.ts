import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  getDay,
  getDate,
} from "date-fns"
import { es } from "date-fns/locale"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { InventoryAlert } from "./components/inventory-alerts-grid"

// Valid sale statuses for revenue calculations
const VALID_STATUSES = ["completed", "partially_returned", "fully_returned"]

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

// ── Helper ──

function toISO(date: Date): string {
  return date.toISOString()
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  credit_note: "Nota de credito",
  other: "Otro",
}

// ── 1. KPI Data ──

export async function fetchKpiData(
  supabase: SupabaseClient
): Promise<KpiData> {
  const now = new Date()
  const todayStart = toISO(startOfDay(now))
  const todayEnd = toISO(endOfDay(now))
  const yesterdayStart = toISO(startOfDay(subDays(now, 1)))
  const yesterdayEnd = toISO(endOfDay(subDays(now, 1)))
  const weekStart = toISO(startOfWeek(now, { weekStartsOn: 1 }))

  const [
    todaySalesRes,
    yesterdaySalesRes,
    todayItemsRes,
    weekItemsRes,
    yesterdayItemsRes,
    todayPaymentsRes,
    stockRes,
  ] = await Promise.all([
    // Today's sales
    supabase
      .from("sales")
      .select("id, total")
      .in("status", VALID_STATUSES)
      .is("deleted_at", null)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd),

    // Yesterday's sales
    supabase
      .from("sales")
      .select("id, total")
      .in("status", VALID_STATUSES)
      .is("deleted_at", null)
      .gte("created_at", yesterdayStart)
      .lte("created_at", yesterdayEnd),

    // Today's sale items (for units sold today)
    supabase
      .from("sales")
      .select("id")
      .in("status", VALID_STATUSES)
      .is("deleted_at", null)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd),

    // This week's sales IDs (for weekly bar chart)
    supabase
      .from("sales")
      .select("id, created_at")
      .in("status", VALID_STATUSES)
      .is("deleted_at", null)
      .gte("created_at", weekStart),

    // Yesterday's sale IDs (for units comparison)
    supabase
      .from("sales")
      .select("id")
      .in("status", VALID_STATUSES)
      .is("deleted_at", null)
      .gte("created_at", yesterdayStart)
      .lte("created_at", yesterdayEnd),

    // Today's payments
    supabase
      .from("sale_payments")
      .select("method, sale_id"),

    // All active variants for stock stats
    supabase
      .from("product_variants")
      .select("stock, stock_min")
      .is("deleted_at", null)
      .eq("is_active", true),
  ])

  // -- Sales totals --
  const todaySales = todaySalesRes.data ?? []
  const yesterdaySales = yesterdaySalesRes.data ?? []
  const ventasDelDia = todaySales.reduce((s, r) => s + Number(r.total ?? 0), 0)
  const ventasAyer = yesterdaySales.reduce(
    (s, r) => s + Number(r.total ?? 0),
    0
  )
  const ventasDelDiaCambio =
    ventasAyer > 0
      ? Math.round(((ventasDelDia - ventasAyer) / ventasAyer) * 1000) / 10
      : ventasDelDia > 0
        ? 100
        : 0
  const ventasMaxDia = Math.max(ventasDelDia, ventasAyer, 1)

  // -- Transactions --
  const transacciones = todaySales.length
  const transaccionesCambio = todaySales.length - yesterdaySales.length

  // -- Products sold (today vs yesterday) --
  const todaySaleIds = (todayItemsRes.data ?? []).map((s) => s.id)
  const yesterdaySaleIds = (yesterdayItemsRes.data ?? []).map((s) => s.id)

  let todayUnits = 0
  let yesterdayUnits = 0

  if (todaySaleIds.length > 0) {
    const { data: items } = await supabase
      .from("sale_items")
      .select("quantity")
      .in("sale_id", todaySaleIds)
    todayUnits = (items ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0)
  }

  if (yesterdaySaleIds.length > 0) {
    const { data: items } = await supabase
      .from("sale_items")
      .select("quantity")
      .in("sale_id", yesterdaySaleIds)
    yesterdayUnits = (items ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0)
  }

  // -- Weekly bar chart (Mon-Sun) --
  const weekSales = weekItemsRes.data ?? []
  const weekSaleIds = weekSales.map((s) => s.id)
  const vendidosPorDia = [0, 0, 0, 0, 0, 0, 0]

  if (weekSaleIds.length > 0) {
    const { data: weekItems } = await supabase
      .from("sale_items")
      .select("quantity, sale_id")
      .in("sale_id", weekSaleIds)

    // Build a map of sale_id → day index
    const saleDayMap = new Map<string, number>()
    for (const sale of weekSales) {
      // getDay: 0=Sun, 1=Mon... convert to Mon=0
      const day = getDay(new Date(sale.created_at))
      const idx = day === 0 ? 6 : day - 1
      saleDayMap.set(sale.id, idx)
    }

    for (const item of weekItems ?? []) {
      const idx = saleDayMap.get(item.sale_id)
      if (idx !== undefined) {
        vendidosPorDia[idx] += item.quantity ?? 0
      }
    }
  }

  const dayIdx = getDay(now) === 0 ? 6 : getDay(now) - 1

  // -- Payment breakdown (today) --
  let pagoTarjeta = 0
  let pagoEfectivo = 0
  let pagoTransferencia = 0

  if (todaySaleIds.length > 0) {
    const todayIdSet = new Set(todaySaleIds)
    const allPayments = todayPaymentsRes.data ?? []
    for (const p of allPayments) {
      if (!todayIdSet.has(p.sale_id)) continue
      if (p.method === "card") pagoTarjeta++
      else if (p.method === "cash") pagoEfectivo++
      else if (p.method === "transfer") pagoTransferencia++
    }
  }

  // -- Stock stats --
  const variants = stockRes.data ?? []
  let inventarioOk = 0
  let inventarioBajo = 0
  let inventarioCritico = 0

  for (const v of variants) {
    if (v.stock_min <= 0 || v.stock > v.stock_min) {
      inventarioOk++
    } else if (v.stock <= v.stock_min * 0.3) {
      inventarioCritico++
    } else {
      inventarioBajo++
    }
  }

  return {
    ventasDelDia,
    ventasDelDiaCambio,
    ventasAyer,
    ventasMaxDia,
    productosVendidos: todayUnits,
    productosVendidosCambio: todayUnits - yesterdayUnits,
    vendidosPorDia,
    vendidosDias: ["L", "M", "X", "J", "V", "S", "D"],
    vendidosDiaActual: dayIdx,
    transacciones,
    transaccionesCambio,
    pagoTarjeta,
    pagoEfectivo,
    pagoTransferencia,
    stockBajoAlertas: inventarioBajo + inventarioCritico,
    inventarioOk,
    inventarioBajo,
    inventarioCritico,
  }
}

// ── 2. Sales Chart Data ──

export async function fetchSalesChartData(
  supabase: SupabaseClient
): Promise<SalesChartData> {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const prevMonthStart = startOfMonth(subMonths(now, 1))
  const prevMonthEnd = endOfMonth(subMonths(now, 1))

  const [currentRes, prevRes] = await Promise.all([
    supabase
      .from("sales")
      .select("total, created_at")
      .in("status", VALID_STATUSES)
      .is("deleted_at", null)
      .gte("created_at", toISO(monthStart))
      .lte("created_at", toISO(monthEnd)),

    supabase
      .from("sales")
      .select("total")
      .in("status", VALID_STATUSES)
      .is("deleted_at", null)
      .gte("created_at", toISO(prevMonthStart))
      .lte("created_at", toISO(prevMonthEnd)),
  ])

  const currentSales = currentRes.data ?? []
  const prevSales = prevRes.data ?? []

  const totalMes = currentSales.reduce(
    (s, r) => s + Number(r.total ?? 0),
    0
  )
  const totalPrev = prevSales.reduce((s, r) => s + Number(r.total ?? 0), 0)
  const cambioMes =
    totalPrev > 0
      ? Math.round(((totalMes - totalPrev) / totalPrev) * 1000) / 10
      : totalMes > 0
        ? 100
        : 0

  // Group by week (days 1-7, 8-14, 15-21, 22+)
  const todayDate = getDate(now)
  const weekBuckets: { start: number; end: number; total: number }[] = [
    { start: 1, end: 7, total: 0 },
    { start: 8, end: 14, total: 0 },
    { start: 15, end: 21, total: 0 },
    { start: 22, end: 31, total: 0 },
  ]

  for (const sale of currentSales) {
    const day = getDate(new Date(sale.created_at))
    const bucket = weekBuckets.find((b) => day >= b.start && day <= b.end)
    if (bucket) bucket.total += Number(sale.total ?? 0)
  }

  const monthName = format(now, "MMM", { locale: es })
  const semanas: WeekData[] = weekBuckets
    .filter((b) => b.start <= todayDate || b.total > 0)
    .map((b, i, arr) => {
      const isLast = i === arr.length - 1
      const endDay = Math.min(
        b.end,
        isLast ? getDate(monthEnd) : b.end
      )
      return {
        label: isLast && b.start <= todayDate ? "Esta sem." : `Sem ${i + 1}`,
        rango: `${monthName} ${b.start}-${endDay}`,
        total: Math.round(b.total * 100) / 100,
        enProgreso: todayDate >= b.start && todayDate <= b.end,
      }
    })

  return { totalMes, cambioMes, semanas }
}

// ── 3. Activity Feed ──

export async function fetchActivityFeed(
  supabase: SupabaseClient
): Promise<ActivityItem[]> {
  const [salesRes, returnsRes] = await Promise.all([
    supabase
      .from("sales")
      .select(
        `id, sale_number, total, created_at, status,
        customers:customers(name),
        sale_items(id),
        sale_payments(method)`
      )
      .in("status", VALID_STATUSES)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),

    supabase
      .from("returns")
      .select(
        `id, return_number, total_refund, created_at,
        sales:sales!returns_sale_id_fkey(sale_number)`
      )
      .eq("status", "completed")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  const items: ActivityItem[] = []

  // Map sales
  for (const s of salesRes.data ?? []) {
    const itemCount = (s.sale_items as { id: string }[])?.length ?? 0
    const methods = (s.sale_payments as { method: string }[]) ?? []
    const uniqueMethods = [...new Set(methods.map((m) => m.method))]
    const methodLabel = uniqueMethods
      .map((m) => PAYMENT_LABELS[m] ?? m)
      .join(", ")

    items.push({
      id: s.id,
      tipo: "venta",
      descripcion: `Venta ${s.sale_number}`,
      detalle: `${itemCount} producto${itemCount !== 1 ? "s" : ""} — ${methodLabel || "Sin pago"}`,
      monto: Number(s.total),
      hora: format(new Date(s.created_at), "HH:mm"),
    })
  }

  // Map returns
  for (const r of returnsRes.data ?? []) {
    const sale = r.sales as unknown as { sale_number: string } | null
    items.push({
      id: r.id,
      tipo: "devolucion",
      descripcion: `Devolucion ${r.return_number}`,
      detalle: sale ? `De venta ${sale.sale_number}` : "Devolucion",
      monto: -Number(r.total_refund),
      hora: format(new Date(r.created_at), "HH:mm"),
    })
  }

  // Sort by time DESC, take first 4
  items.sort(
    (a, b) =>
      new Date(`2000-01-01T${b.hora}`).getTime() -
      new Date(`2000-01-01T${a.hora}`).getTime()
  )

  return items.slice(0, 4)
}

// ── 4. Top Products ──

export async function fetchTopProducts(
  supabase: SupabaseClient
): Promise<TopProduct[]> {
  const monthStart = startOfMonth(new Date())

  // Get this month's completed sale IDs
  const { data: sales } = await supabase
    .from("sales")
    .select("id")
    .in("status", VALID_STATUSES)
    .is("deleted_at", null)
    .gte("created_at", toISO(monthStart))

  const saleIds = (sales ?? []).map((s) => s.id)
  if (saleIds.length === 0) return []

  // Get all sale items for those sales
  const { data: items } = await supabase
    .from("sale_items")
    .select(
      "product_name, variant_label, quantity, unit_price, unit_cost, discount, line_total"
    )
    .in("sale_id", saleIds)

  if (!items || items.length === 0) return []

  // Group by product_name
  const productMap = new Map<
    string,
    {
      variante: string
      unidades: number
      ingresos: number
      costo: number
      maxQty: number
      maxVariant: string
    }
  >()

  for (const item of items) {
    const key = item.product_name
    const existing = productMap.get(key) ?? {
      variante: item.variant_label,
      unidades: 0,
      ingresos: 0,
      costo: 0,
      maxQty: 0,
      maxVariant: item.variant_label,
    }

    existing.unidades += item.quantity
    existing.ingresos += Number(item.line_total)
    existing.costo += Number(item.unit_cost) * item.quantity

    // Track top variant for this product
    if (item.quantity > existing.maxQty) {
      existing.maxQty = item.quantity
      existing.maxVariant = item.variant_label
    }

    productMap.set(key, existing)
  }

  // Sort by revenue, take top 5
  return [...productMap.entries()]
    .sort((a, b) => b[1].ingresos - a[1].ingresos)
    .slice(0, 5)
    .map(([nombre, data]) => ({
      nombre,
      variante: data.maxVariant,
      unidades: data.unidades,
      ingresos: Math.round(data.ingresos * 100) / 100,
      margen:
        data.ingresos > 0
          ? Math.round(
              ((data.ingresos - data.costo) / data.ingresos) * 100
            )
          : 0,
    }))
}

// ── 5. Inventory Alerts (moved from inline page.tsx) ──

export async function fetchInventoryAlerts(
  supabase: SupabaseClient
): Promise<InventoryAlert[]> {
  const { data: lowStockVariants } = await supabase
    .from("product_variants")
    .select(
      `id, sku, name, stock, stock_min, is_active,
      products!inner(name, brand, deleted_at)`
    )
    .is("deleted_at", null)
    .is("products.deleted_at", null)
    .eq("is_active", true)

  return (lowStockVariants ?? [])
    .filter(
      (v: { stock: number; stock_min: number }) =>
        v.stock_min > 0 && v.stock <= v.stock_min
    )
    .sort(
      (
        a: { stock: number; stock_min: number },
        b: { stock: number; stock_min: number }
      ) => a.stock - a.stock_min - (b.stock - b.stock_min)
    )
    .map(
      (v: {
        stock: number
        stock_min: number
        name: string | null
        sku: string | null
        products: { name: string; brand: string | null }[]
      }) => ({
        nombre: v.products[0]?.name ?? "—",
        variante: v.name || v.sku || "—",
        stockActual: v.stock,
        stockMinimo: v.stock_min,
        estado: (v.stock <= v.stock_min * 0.3 ? "critico" : "bajo") as
          | "critico"
          | "bajo",
      })
    )
}
