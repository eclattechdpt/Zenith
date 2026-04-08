import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { es } from "date-fns/locale"

import { createClient } from "@/lib/supabase/client"
import { SALE_STATUSES, PAYMENT_METHODS } from "@/lib/constants"

// ── Font aliases (built-in Helvetica — guaranteed to render) ──
const FONT = "Helvetica"
const FONT_BOLD = "Helvetica-Bold"

// ── Constants ──

const VALID_STATUSES = ["completed", "partially_returned", "fully_returned"]
const BUSINESS_NAME = "Eclat"

// Warm neutral palette from design system
const N = {
  50:  "#FDFBFA",
  100: "#F7F3F0",
  200: "#EDE7E2",
  300: "#DED6CF",
  400: "#C4B8AE",
  500: "#A99D93",
  600: "#8A7F76",
  700: "#6E655E",
  800: "#4E4741",
  900: "#302B27",
  950: "#1A1714",
}

const ACCENT = {
  rose:    { bg: "#FFF0F3", fill: "#F43F6B", text: "#871335", muted: "#FFE0E8" },
  teal:    { bg: "#EFFCFC", fill: "#25A6B6", text: "#1E3D47", muted: "#D6F6F8" },
  amber:   { bg: "#FFFBEB", fill: "#D97706", text: "#92400E", muted: "#FDE68A" },
  violet:  { bg: "#F5F3FF", fill: "#7C3AED", text: "#5B21B6", muted: "#DDD6FE" },
  pink:    { bg: "#FFF8F9", fill: "#DB2777", text: "#7A3A4C", muted: "#FFDDE3" },
  emerald: { bg: "#ECFDF5", fill: "#059669", text: "#065F46", muted: "#A7F3D0" },
  blush:   { bg: "#FFF8F9", fill: "#FF96AE", text: "#9E4A60", muted: "#FFC4CF" },
} as const

type AccentKey = keyof typeof ACCENT
type AccentColors = (typeof ACCENT)[AccentKey]

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]

// ── Shared styles ──

const s = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: FONT,
    fontSize: 9,
    color: N[900],
  },
})

// ── Utility functions ──

function currency(n: number) {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Reusable layout components ──

function Header({ title, subtitle, accent }: { title: string; subtitle: string; accent: AccentColors }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 24, fontFamily: FONT_BOLD, color: N[950], letterSpacing: -0.5 }}>
        {BUSINESS_NAME}
      </Text>
      <Text style={{ fontSize: 11, color: accent.fill, marginTop: 2, fontFamily: FONT_BOLD }}>
        {title}
      </Text>
      <View style={{ height: 3, backgroundColor: accent.fill, marginTop: 12, borderRadius: 2 }} />
      <Text style={{
        fontSize: 7,
        color: N[500],
        marginTop: 8,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        fontFamily: FONT,
      }}>
        {subtitle}
      </Text>
    </View>
  )
}

function KpiCards({ metrics, accent }: { metrics: { label: string; value: string }[]; accent: AccentColors }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 18 }}>
      {metrics.map((m, i) => (
        <View
          key={m.label}
          style={{
            flex: 1,
            backgroundColor: accent.bg,
            borderRadius: 8,
            padding: 12,
            marginRight: i < metrics.length - 1 ? 8 : 0,
            borderLeftWidth: 3,
            borderLeftColor: accent.fill,
          }}
        >
          <Text style={{ fontSize: 16, fontFamily: FONT_BOLD, color: N[950] }}>
            {m.value}
          </Text>
          <View style={{ height: 1.5, width: 24, backgroundColor: accent.muted, marginTop: 6, marginBottom: 6, borderRadius: 1 }} />
          <Text style={{
            fontSize: 6.5,
            color: N[600],
            textTransform: "uppercase",
            letterSpacing: 1,
            fontFamily: FONT,
              }}>
            {m.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

function SectionLabel({ text, accent }: { text: string; accent: AccentColors }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 10 }}>
      <View style={{ width: 3, height: 12, backgroundColor: accent.fill, borderRadius: 2, marginRight: 8 }} />
      <Text style={{
        fontSize: 7.5,
        fontFamily: FONT,
        color: N[800],
        textTransform: "uppercase",
        letterSpacing: 1.5,
      }}>
        {text}
      </Text>
    </View>
  )
}

function TableHeader({ columns, accent }: { columns: { label: string; flex?: number; align?: "right" | "left" }[]; accent: AccentColors }) {
  return (
    <View style={{
      flexDirection: "row",
      backgroundColor: N[900],
      borderRadius: 4,
      paddingVertical: 6,
      paddingHorizontal: 8,
      marginBottom: 2,
    }}>
      {columns.map((col) => (
        <View key={col.label} style={{ flex: col.flex ?? 1, overflow: "hidden", paddingRight: 4 }}>
          <Text

            style={{
              fontSize: 7,
              fontFamily: FONT_BOLD,
              color: N[200],
              textAlign: col.align ?? "left",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {col.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

function TableRow({ cells, columns, index }: {
  cells: (string | number)[];
  columns: { flex?: number; align?: "right" | "left"; color?: string; bold?: boolean }[];
  index: number;
}) {
  return (
    <View style={{
      flexDirection: "row",
      backgroundColor: index % 2 === 0 ? "#ffffff" : N[50],
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: N[200],
    }}>
      {cells.map((cell, ci) => {
        const col = columns[ci] ?? {}
        return (
          <View key={ci} style={{ flex: col.flex ?? 1, overflow: "hidden", paddingRight: 4 }}>
            <Text
  
              style={{
                fontSize: 8.5,
                color: col.color ?? N[800],
                textAlign: col.align ?? "left",
                fontFamily: col.bold ? FONT_BOLD : FONT,
              }}
            >
              {cell}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function InfoCard({ children, accent }: { children: React.ReactNode; accent?: AccentColors }) {
  return (
    <View style={{
      backgroundColor: accent ? accent.bg : N[100],
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
      borderLeftWidth: accent ? 3 : 0,
      borderLeftColor: accent ? accent.fill : "transparent",
    }}>
      {children}
    </View>
  )
}

function Footer() {
  return (
    <View style={{
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: N[200],
      paddingTop: 8,
    }}>
      <Text style={{ fontSize: 7, color: N[500], textAlign: "center", fontFamily: FONT }}>
        Generado por Eclat POS — {format(new Date(), "dd/MM/yyyy HH:mm")}
      </Text>
    </View>
  )
}

function TotalRow({ cells, columns, accent }: {
  cells: (string | number)[];
  columns: { flex?: number; align?: "right" | "left" }[];
  accent: AccentColors;
}) {
  return (
    <View style={{
      flexDirection: "row",
      backgroundColor: accent.bg,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 4,
      marginTop: 2,
      borderLeftWidth: 3,
      borderLeftColor: accent.fill,
    }}>
      {cells.map((cell, ci) => {
        const col = columns[ci] ?? {}
        return (
          <View key={ci} style={{ flex: col.flex ?? 1, overflow: "hidden", paddingRight: 4 }}>
            <Text
  
              style={{
                fontSize: 8.5,
                color: accent.text,
                textAlign: col.align ?? "left",
                fontFamily: FONT_BOLD,
              }}
            >
              {cell}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

// ── Payment breakdown with bars ──

function PaymentBreakdown({ methodTotals, totalRevenue, accent }: {
  methodTotals: Record<string, number>;
  totalRevenue: number;
  accent: AccentColors;
}) {
  const entries = Object.entries(methodTotals)
  if (entries.length === 0) return null

  return (
    <InfoCard>
      <Text style={{
        fontSize: 6.5,
        color: N[600],
        textTransform: "uppercase",
        letterSpacing: 1,
        fontFamily: FONT,
        marginBottom: 10,
      }}>
        Desglose por metodo de pago
      </Text>
      {entries.map(([method, total]) => {
        const pct = totalRevenue > 0 ? (total / totalRevenue) * 100 : 0
        const barWidth = Math.max(pct, 2)
        return (
          <View key={method} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={{ fontSize: 8.5, color: N[800], fontFamily: FONT }}>
                {PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS] ?? method}
              </Text>
              <Text style={{ fontSize: 8.5, fontFamily: FONT_BOLD, color: N[950] }}>
                {currency(total)} ({pct.toFixed(1)}%)
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: N[200], borderRadius: 3 }}>
              <View style={{
                height: 6,
                width: `${barWidth}%`,
                backgroundColor: accent.fill,
                borderRadius: 3,
              }} />
            </View>
          </View>
        )
      })}
    </InfoCard>
  )
}

// ── Stock status helpers ──

function stockStatusColor(stock: number, stockMin: number): string {
  if (stockMin <= 0) return "#059669"
  if (stock <= stockMin * 0.3) return "#DC2626"
  if (stock <= stockMin) return "#D97706"
  return "#059669"
}

function stockStatusLabel(stock: number, stockMin: number): string {
  if (stockMin <= 0) return "OK"
  if (stock <= stockMin * 0.3) return "Critico"
  if (stock <= stockMin) return "Bajo"
  return "OK"
}

// ── Shared render: Sales report ──

function renderSalesReport({
  salesList,
  totalRevenue,
  avgTicket,
  methodTotals,
  dateRange,
  reportTitle,
}: {
  salesList: {
    sale_number: string
    status: string
    total: number
    created_at: string
    customers: unknown
    sale_payments: { method: string; amount: number }[]
  }[]
  totalRevenue: number
  avgTicket: number
  methodTotals: Record<string, number>
  dateRange: string
  reportTitle: string
}) {
  const accent = ACCENT.rose

  const salesColumns = [
    { label: "Folio" },
    { label: "Estado" },
    { label: "Cliente" },
    { label: "Total", align: "right" as const },
    { label: "Fecha", align: "right" as const },
  ]

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Header title={reportTitle} subtitle={dateRange} accent={accent} />

        <KpiCards
          accent={accent}
          metrics={[
            { label: "Total ventas", value: currency(totalRevenue) },
            { label: "Transacciones", value: String(salesList.length) },
            { label: "Ticket promedio", value: currency(avgTicket) },
          ]}
        />

        <PaymentBreakdown methodTotals={methodTotals} totalRevenue={totalRevenue} accent={accent} />

        <SectionLabel text="Detalle de ventas" accent={accent} />
        <TableHeader columns={salesColumns} accent={accent} />
        {salesList.slice(0, 50).map((sale, i) => (
          <TableRow
            key={sale.sale_number}
            index={i}
            cells={[
              sale.sale_number,
              SALE_STATUSES[sale.status as keyof typeof SALE_STATUSES] ?? sale.status,
              (sale.customers as { name: string } | null)?.name ?? "—",
              currency(Number(sale.total)),
              format(new Date(sale.created_at), "dd/MM/yy"),
            ]}
            columns={salesColumns.map((c) => ({ align: c.align }))}
          />
        ))}

        {salesList.length > 50 && (
          <Text style={{ fontSize: 7, color: N[500], marginTop: 6, textAlign: "center" }}>
            Mostrando 50 de {salesList.length} ventas
          </Text>
        )}

        <Footer />
      </Page>
    </Document>
  )
}

// ── Shared render: Transit report ──

function renderTransitReport({
  weeksList,
  totalValue,
  dateRange,
}: {
  weeksList: {
    year: number
    month: number
    week_number: number
    label: string | null
    total_value: number
    transit_week_items: {
      quantity: number
      unit_price: number
      line_total: number
      product_variants: {
        name: string | null
        sku: string | null
        products: { name: string }
      }
    }[]
  }[]
  totalValue: number
  dateRange: string
}) {
  const accent = ACCENT.amber

  const detailColumns = [
    { label: "Periodo" },
    { label: "Producto", flex: 2 },
    { label: "Cant.", align: "right" as const },
    { label: "Precio", align: "right" as const },
    { label: "Total", align: "right" as const },
  ]

  // Flatten weeks into renderable rows
  const flatRows: { period: string; product: string; qty: string; price: string; total: string }[] = []
  for (const week of weeksList.slice(0, 40)) {
    const items = week.transit_week_items ?? []
    const periodLabel = `${MONTH_NAMES[week.month]} S${week.week_number} (${week.year})`
    if (items.length === 0) {
      flatRows.push({
        period: periodLabel,
        product: "Sin productos",
        qty: "—",
        price: "—",
        total: currency(Number(week.total_value)),
      })
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const productName = item.product_variants?.products?.name ?? "—"
        const variantName = item.product_variants?.name ? ` (${item.product_variants.name})` : ""
        flatRows.push({
          period: i === 0 ? periodLabel : "",
          product: `${productName}${variantName}`,
          qty: String(item.quantity),
          price: currency(Number(item.unit_price)),
          total: currency(Number(item.line_total)),
        })
      }
    }
  }

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Header title="Inventario en Transito" subtitle={dateRange} accent={accent} />

        <KpiCards
          accent={accent}
          metrics={[
            { label: "Semanas registradas", value: String(weeksList.length) },
            { label: "Valor total en transito", value: currency(totalValue) },
          ]}
        />

        <SectionLabel text="Detalle por semana" accent={accent} />
        <TableHeader columns={detailColumns} accent={accent} />
        {flatRows.map((row, i) => (
          <TableRow
            key={i}
            index={i}
            cells={[row.period, row.product, row.qty, row.price, row.total]}
            columns={[
              {},
              { flex: 2 },
              { align: "right" },
              { align: "right" },
              { align: "right" },
            ]}
          />
        ))}

        <Footer />
      </Page>
    </Document>
  )
}

// ══════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ══════════════════════════════════════════════════════════════════

// ── 1. Monthly Sales PDF ──

export async function exportSalesPdf(monthDate?: Date) {
  const supabase = createClient()
  const target = monthDate ?? new Date()
  const monthStart = startOfMonth(target)
  const monthEnd = endOfMonth(target)

  const { data: sales } = await supabase
    .from("sales")
    .select(
      `sale_number, status, total, created_at,
      customers:customers(name),
      sale_payments(method, amount)`
    )
    .in("status", VALID_STATUSES)
    .is("deleted_at", null)
    .gte("created_at", monthStart.toISOString())
    .lte("created_at", monthEnd.toISOString())
    .order("created_at", { ascending: false })

  const salesList = sales ?? []
  const totalRevenue = salesList.reduce(
    (s, r) => s + Number(r.total ?? 0),
    0
  )
  const avgTicket =
    salesList.length > 0 ? totalRevenue / salesList.length : 0

  const methodTotals: Record<string, number> = {}
  for (const s of salesList) {
    for (const p of (s.sale_payments as { method: string; amount: number }[]) ??
      []) {
      methodTotals[p.method] = (methodTotals[p.method] ?? 0) + Number(p.amount)
    }
  }

  const dateRange = `${format(monthStart, "MMMM yyyy", { locale: es })}`

  const doc = renderSalesReport({
    salesList: salesList as unknown as Parameters<typeof renderSalesReport>[0]["salesList"],
    totalRevenue,
    avgTicket,
    methodTotals,
    dateRange,
    reportTitle: "Reporte de Ventas",
  })

  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `reporte-ventas-${format(monthStart, "yyyy-MM")}.pdf`)
}

// ── 2. Custom Range Sales PDF ──

export async function exportSalesRangePdf(from: Date, to: Date) {
  const supabase = createClient()

  const { data: sales } = await supabase
    .from("sales")
    .select(
      `sale_number, status, total, created_at,
      customers:customers(name),
      sale_payments(method, amount)`
    )
    .in("status", VALID_STATUSES)
    .is("deleted_at", null)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: false })

  const salesList = sales ?? []
  const totalRevenue = salesList.reduce(
    (s, r) => s + Number(r.total ?? 0),
    0
  )
  const avgTicket =
    salesList.length > 0 ? totalRevenue / salesList.length : 0

  const methodTotals: Record<string, number> = {}
  for (const s of salesList) {
    for (const p of (s.sale_payments as { method: string; amount: number }[]) ?? []) {
      methodTotals[p.method] = (methodTotals[p.method] ?? 0) + Number(p.amount)
    }
  }

  const dateRange = `${format(from, "d MMM yyyy", { locale: es })} — ${format(to, "d MMM yyyy", { locale: es })}`

  const doc = renderSalesReport({
    salesList: salesList as unknown as Parameters<typeof renderSalesReport>[0]["salesList"],
    totalRevenue,
    avgTicket,
    methodTotals,
    dateRange,
    reportTitle: "Reporte de Ventas",
  })

  const label = `${format(from, "yyyy-MM-dd")}_${format(to, "yyyy-MM-dd")}`
  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `reporte-ventas-${label}.pdf`)
}

// ── 3. Weekly Sales PDF ──

export async function exportWeeklySalesPdf(weekStart: Date) {
  const supabase = createClient()

  const from = startOfWeek(weekStart, { weekStartsOn: 1 })
  const to = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: from, end: to })

  const { data: sales } = await supabase
    .from("sales")
    .select(
      `id, sale_number, status, total, created_at,
      customers:customers(name),
      sale_items(product_name, quantity, unit_price, line_total),
      sale_payments(method, amount)`
    )
    .in("status", VALID_STATUSES)
    .is("deleted_at", null)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: false })

  const salesList = (sales ?? []) as unknown as {
    id: string
    sale_number: string
    status: string
    total: number
    created_at: string
    customers: { name: string } | null
    sale_items: { product_name: string; quantity: number; unit_price: number; line_total: number }[]
    sale_payments: { method: string; amount: number }[]
  }[]

  // ── Aggregations ──
  const totalRevenue = salesList.reduce((s, r) => s + Number(r.total ?? 0), 0)
  const totalTransactions = salesList.length
  const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
  const totalUnits = salesList.reduce(
    (s, r) => s + (r.sale_items ?? []).reduce((si, item) => si + item.quantity, 0),
    0
  )

  // Payment method breakdown
  const methodTotals: Record<string, number> = {}
  for (const sale of salesList) {
    for (const p of sale.sale_payments ?? []) {
      methodTotals[p.method] = (methodTotals[p.method] ?? 0) + Number(p.amount)
    }
  }

  // Daily breakdown
  const dailyData = days.map((day) => {
    const daySales = salesList.filter((sale) => isSameDay(new Date(sale.created_at), day))
    const revenue = daySales.reduce((sum, r) => sum + Number(r.total ?? 0), 0)
    return {
      label: DAY_NAMES[day.getDay()],
      date: format(day, "dd/MM"),
      count: daySales.length,
      revenue,
      avg: daySales.length > 0 ? revenue / daySales.length : 0,
    }
  })

  const maxDayRevenue = Math.max(...dailyData.map((d) => d.revenue), 1)

  // Top 5 products by revenue
  const productMap = new Map<string, { units: number; revenue: number }>()
  for (const sale of salesList) {
    for (const item of sale.sale_items ?? []) {
      const key = item.product_name
      const existing = productMap.get(key) ?? { units: 0, revenue: 0 }
      existing.units += item.quantity
      existing.revenue += Number(item.line_total)
      productMap.set(key, existing)
    }
  }
  const topProducts = [...productMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  const dateRange = `${format(from, "d MMM", { locale: es })} — ${format(to, "d MMM yyyy", { locale: es })}`
  const accent = ACCENT.rose

  const dailyColumns = [
    { label: "Dia" },
    { label: "Fecha" },
    { label: "Ventas", align: "right" as const },
    { label: "Ingresos", align: "right" as const },
    { label: "", flex: 1.5 },
  ]

  const salesColumns = [
    { label: "Folio" },
    { label: "Estado" },
    { label: "Cliente" },
    { label: "Total", align: "right" as const },
    { label: "Fecha", align: "right" as const },
  ]

  const doc = (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Header title="Reporte Semanal de Ventas" subtitle={dateRange} accent={accent} />

        <KpiCards
          accent={accent}
          metrics={[
            { label: "Total ingresos", value: currency(totalRevenue) },
            { label: "Transacciones", value: String(totalTransactions) },
            { label: "Ticket promedio", value: currency(avgTicket) },
            { label: "Unidades vendidas", value: String(totalUnits) },
          ]}
        />

        {/* Daily breakdown with mini bars */}
        <SectionLabel text="Desglose por dia" accent={accent} />
        <TableHeader columns={dailyColumns} accent={accent} />
        {dailyData.map((d, i) => {
          const barPct = maxDayRevenue > 0 ? Math.max((d.revenue / maxDayRevenue) * 100, 0) : 0
          return (
            <View
              key={d.date}
              style={{
                flexDirection: "row",
                backgroundColor: i % 2 === 0 ? "#ffffff" : N[100],
                paddingVertical: 5,
                paddingHorizontal: 8,
                borderBottomWidth: 0.5,
                borderBottomColor: N[200],
              }}
            >
              <Text style={{ flex: 1, fontSize: 8.5, color: N[800] }}>{d.label}</Text>
              <Text style={{ flex: 1, fontSize: 8.5, color: N[800] }}>{d.date}</Text>
              <Text style={{ flex: 1, fontSize: 8.5, color: N[800], textAlign: "right" }}>{d.count}</Text>
              <Text style={{ flex: 1, fontSize: 8.5, color: N[800], textAlign: "right", fontFamily: FONT_BOLD }}>
                {currency(d.revenue)}
              </Text>
              <View style={{ flex: 1.5, justifyContent: "center", paddingLeft: 8 }}>
                <View style={{ height: 6, backgroundColor: N[200], borderRadius: 3 }}>
                  <View style={{
                    height: 6,
                    width: `${barPct}%`,
                    backgroundColor: accent.fill,
                    borderRadius: 3,
                  }} />
                </View>
              </View>
            </View>
          )
        })}
        <TotalRow
          accent={accent}
          cells={["Total", "", String(totalTransactions), currency(totalRevenue), ""]}
          columns={[{}, {}, { align: "right" }, { align: "right" }, { flex: 1.5 }]}
        />

        {/* Payment methods */}
        <View style={{ marginTop: 4 }}>
          <PaymentBreakdown methodTotals={methodTotals} totalRevenue={totalRevenue} accent={accent} />
        </View>

        {/* Top 5 products */}
        {topProducts.length > 0 && (
          <>
            <SectionLabel text="Top 5 productos" accent={accent} />
            {topProducts.map(([name, data], i) => (
              <View
                key={name}
                wrap={false}
                style={{
                  flexDirection: "row",
                  backgroundColor: i % 2 === 0 ? N[100] : "#ffffff",
                  borderRadius: 6,
                  padding: 8,
                  marginBottom: 4,
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: accent.bg,
                  justifyContent: "center",
                  marginRight: 8,
                }}>
                  <Text style={{
                    fontSize: 9,
                    fontFamily: FONT_BOLD,
                    color: accent.fill,
                    textAlign: "center",
                  }}>
                    {i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8.5, color: N[950], fontFamily: FONT_BOLD }}>{name}</Text>
                  <Text style={{ fontSize: 7.5, color: N[600], marginTop: 1 }}>
                    {data.units} uds  —  {currency(data.revenue)}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Sales detail */}
        <SectionLabel text="Detalle de ventas" accent={accent} />
        <TableHeader columns={salesColumns} accent={accent} />
        {salesList.slice(0, 50).map((sale, i) => (
          <TableRow
            key={sale.sale_number}
            index={i}
            cells={[
              sale.sale_number,
              SALE_STATUSES[sale.status as keyof typeof SALE_STATUSES] ?? sale.status,
              sale.customers?.name ?? "—",
              currency(Number(sale.total)),
              format(new Date(sale.created_at), "dd/MM HH:mm"),
            ]}
            columns={salesColumns.map((c) => ({ align: c.align }))}
          />
        ))}

        {salesList.length > 50 && (
          <Text style={{ fontSize: 7, color: N[500], marginTop: 6, textAlign: "center" }}>
            Mostrando 50 de {salesList.length} ventas
          </Text>
        )}

        <Footer />
      </Page>
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `reporte-semanal-${format(from, "yyyy-MM-dd")}.pdf`)
}

// ── 4. Physical Inventory PDF ──

export async function exportInventoryPdf() {
  const supabase = createClient()

  const { data } = await supabase
    .from("product_variants")
    .select(
      `id, sku, name, price, stock, stock_min, is_active,
      products!inner(name, brand, deleted_at)`
    )
    .is("deleted_at", null)
    .is("products.deleted_at", null)
    .eq("is_active", true)
    .order("products(name)")

  const rawVariants = (data ?? []) as unknown as {
    sku: string | null
    name: string | null
    price: number
    stock: number
    stock_min: number
    products: { name: string; brand: string | null } | { name: string; brand: string | null }[]
  }[]

  // Normalize products (Supabase !inner may return object or array)
  const variants = rawVariants.map((v) => {
    const p = Array.isArray(v.products) ? v.products[0] : v.products
    return { ...v, productName: p?.name ?? "—" }
  })

  const totalSKUs = variants.length
  const totalValue = variants.reduce(
    (s, v) => s + Number(v.price) * v.stock,
    0
  )
  const critical = variants.filter(
    (v) => v.stock_min > 0 && v.stock <= v.stock_min * 0.3
  )
  const low = variants.filter(
    (v) =>
      v.stock_min > 0 &&
      v.stock <= v.stock_min &&
      v.stock > v.stock_min * 0.3
  )

  const accent = ACCENT.teal

  const tableColumns = [
    { label: "Producto", flex: 2 },
    { label: "Variante" },
    { label: "Codigo" },
    { label: "Precio", align: "right" as const },
    { label: "Stock", align: "right" as const },
    { label: "Min", align: "right" as const },
    { label: "Estado", align: "right" as const },
  ]

  const doc = (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Header
          title="Inventario Fisico"
          subtitle={format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          accent={accent}
        />

        <KpiCards
          accent={accent}
          metrics={[
            { label: "SKUs activos", value: String(totalSKUs) },
            { label: "Valor en stock", value: currency(totalValue) },
            { label: "Stock bajo", value: String(low.length) },
            { label: "Stock critico", value: String(critical.length) },
          ]}
        />

        {/* Alerts summary */}
        {(critical.length > 0 || low.length > 0) && (
          <InfoCard>
            <Text style={{
              fontSize: 6.5,
              color: N[600],
              textTransform: "uppercase",
              letterSpacing: 1,
              fontFamily: FONT_BOLD,
              marginBottom: 8,
            }}>
              Alertas de inventario
            </Text>
            {critical.length > 0 && (
              <View style={{ flexDirection: "row", marginBottom: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#DC2626", marginRight: 6, marginTop: 1 }} />
                <Text style={{ fontSize: 8.5, color: N[800] }}>
                  {critical.length} producto{critical.length !== 1 ? "s" : ""} en nivel critico
                </Text>
              </View>
            )}
            {low.length > 0 && (
              <View style={{ flexDirection: "row" }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#D97706", marginRight: 6, marginTop: 1 }} />
                <Text style={{ fontSize: 8.5, color: N[800] }}>
                  {low.length} producto{low.length !== 1 ? "s" : ""} con stock bajo
                </Text>
              </View>
            )}
          </InfoCard>
        )}

        <SectionLabel text="Inventario completo" accent={accent} />
        <TableHeader columns={tableColumns} accent={accent} />
        {variants.slice(0, 80).map((v, i) => {
          const statusColor = stockStatusColor(v.stock, v.stock_min)
          const statusText = stockStatusLabel(v.stock, v.stock_min)
          return (
            <TableRow
              key={i}
              index={i}
              cells={[
                v.productName,
                v.name ?? "—",
                v.sku ?? "—",
                currency(Number(v.price)),
                String(v.stock),
                String(v.stock_min),
                statusText,
              ]}
              columns={[
                { flex: 2 },
                {},
                {},
                { align: "right" },
                { align: "right" },
                { align: "right" },
                { align: "right", color: statusColor, bold: true },
              ]}
            />
          )
        })}

        {variants.length > 80 && (
          <Text style={{ fontSize: 7, color: N[500], marginTop: 6, textAlign: "center" }}>
            Mostrando 80 de {variants.length} variantes
          </Text>
        )}

        <Footer />
      </Page>
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  downloadBlob(
    blob,
    `inventario-fisico-${format(new Date(), "yyyy-MM-dd")}.pdf`
  )
}

// ── 5. Transit Inventory PDF ──

export async function exportTransitPdf() {
  const supabase = createClient()

  const { data: weeks } = await supabase
    .from("transit_weeks")
    .select(
      `id, year, month, week_number, label, total_value,
      transit_week_items(
        quantity, unit_price, line_total,
        product_variants!inner(
          name, sku,
          products!inner(name)
        )
      )`
    )
    .is("deleted_at", null)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("week_number", { ascending: false })

  const weeksList = (weeks ?? []) as unknown as {
    year: number
    month: number
    week_number: number
    label: string | null
    total_value: number
    transit_week_items: {
      quantity: number
      unit_price: number
      line_total: number
      product_variants: {
        name: string | null
        sku: string | null
        products: { name: string }
      }
    }[]
  }[]

  const totalValue = weeksList.reduce(
    (s, w) => s + Number(w.total_value ?? 0), 0
  )

  const doc = renderTransitReport({
    weeksList,
    totalValue,
    dateRange: format(new Date(), "d 'de' MMMM, yyyy", { locale: es }),
  })

  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `inventario-transito-${format(new Date(), "yyyy-MM-dd")}.pdf`)
}

// ── 6. Transit Inventory Range PDF ──

export async function exportTransitRangePdf(fromDate: Date, toDate: Date) {
  const supabase = createClient()

  const fromYear = fromDate.getFullYear()
  const fromMonth = fromDate.getMonth() + 1
  const toYear = toDate.getFullYear()
  const toMonth = toDate.getMonth() + 1

  const { data: weeks } = await supabase
    .from("transit_weeks")
    .select(
      `id, year, month, week_number, label, total_value,
      transit_week_items(
        quantity, unit_price, line_total,
        product_variants!inner(
          name, sku,
          products!inner(name)
        )
      )`
    )
    .is("deleted_at", null)
    .gte("year", fromYear)
    .lte("year", toYear)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("week_number", { ascending: false })

  // Client-side month filter for exact range
  const weeksList = ((weeks ?? []) as unknown as {
    year: number
    month: number
    week_number: number
    label: string | null
    total_value: number
    transit_week_items: {
      quantity: number
      unit_price: number
      line_total: number
      product_variants: {
        name: string | null
        sku: string | null
        products: { name: string }
      }
    }[]
  }[]).filter((w) => {
    if (w.year === fromYear && w.year === toYear)
      return w.month >= fromMonth && w.month <= toMonth
    if (w.year === fromYear) return w.month >= fromMonth
    if (w.year === toYear) return w.month <= toMonth
    return true
  })

  const totalValue = weeksList.reduce(
    (s, w) => s + Number(w.total_value ?? 0), 0
  )

  const dateRange = `${format(fromDate, "d MMM yyyy", { locale: es })} — ${format(toDate, "d MMM yyyy", { locale: es })}`

  const doc = renderTransitReport({
    weeksList,
    totalValue,
    dateRange,
  })

  const label = `${format(fromDate, "yyyy-MM-dd")}_${format(toDate, "yyyy-MM-dd")}`
  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `inventario-transito-${label}.pdf`)
}

// ── 7. Initial Load PDF ──

export async function exportInitialLoadPdf() {
  const supabase = createClient()

  const { data: variants } = await supabase
    .from("product_variants")
    .select(
      `id, sku, name, price, initial_stock, is_active,
      products!inner(name, brand, deleted_at)`
    )
    .is("deleted_at", null)
    .is("products.deleted_at", null)

  const { data: overrides } = await supabase
    .from("initial_load_overrides")
    .select("product_variant_id, override_name, override_price")

  const overrideMap = new Map(
    (overrides ?? []).map((o) => [o.product_variant_id, o])
  )

  const items = ((variants ?? []) as unknown as {
    id: string
    sku: string | null
    name: string | null
    price: number
    initial_stock: number | null
    products: { name: string; brand: string | null } | { name: string; brand: string | null }[]
  }[])
    .filter((v) => v.initial_stock !== null && v.initial_stock > 0)
    .map((v) => {
      const override = overrideMap.get(v.id)
      const p = Array.isArray(v.products) ? v.products[0] : v.products
      const prodName = override?.override_name ?? p?.name ?? "—"
      const price = override?.override_price
        ? Number(override.override_price)
        : Number(v.price)
      return {
        producto: prodName,
        variante: v.name ?? v.sku ?? "—",
        stock: v.initial_stock!,
        precio: price,
        valor: price * v.initial_stock!,
        editado: !!override,
      }
    })

  const totalValue = items.reduce((s, i) => s + i.valor, 0)
  const totalUnits = items.reduce((s, i) => s + i.stock, 0)

  const accent = ACCENT.violet

  const tableColumns = [
    { label: "Producto", flex: 2 },
    { label: "Variante" },
    { label: "Stock", align: "right" as const },
    { label: "Precio", align: "right" as const },
    { label: "Valor", align: "right" as const },
  ]

  const doc = (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Header
          title="Inventario Carga Inicial"
          subtitle={format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          accent={accent}
        />

        <KpiCards
          accent={accent}
          metrics={[
            { label: "Total productos", value: String(items.length) },
            { label: "Total unidades", value: String(totalUnits) },
            { label: "Valor total", value: currency(totalValue) },
          ]}
        />

        <SectionLabel text="Detalle de carga inicial" accent={accent} />
        <TableHeader columns={tableColumns} accent={accent} />
        {items.slice(0, 80).map((item, i) => (
          <TableRow
            key={i}
            index={i}
            cells={[
              `${item.producto}${item.editado ? "  *" : ""}`,
              item.variante,
              String(item.stock),
              currency(item.precio),
              currency(item.valor),
            ]}
            columns={[
              { flex: 2 },
              {},
              { align: "right" },
              { align: "right" },
              { align: "right" },
            ]}
          />
        ))}

        {/* Totals row */}
        <TotalRow
          accent={accent}
          cells={["Total", "", String(totalUnits), "", currency(totalValue)]}
          columns={[
            { flex: 2 },
            {},
            { align: "right" },
            { align: "right" },
            { align: "right" },
          ]}
        />

        {items.some((i) => i.editado) && (
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent.fill, marginRight: 6, marginTop: 2 }} />
            <Text style={{ fontSize: 7.5, color: N[600] }}>
              * Nombre o precio editado manualmente
            </Text>
          </View>
        )}

        {items.length > 80 && (
          <Text style={{ fontSize: 7, color: N[500], marginTop: 6, textAlign: "center" }}>
            Mostrando 80 de {items.length} productos
          </Text>
        )}

        <Footer />
      </Page>
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `carga-inicial-${format(new Date(), "yyyy-MM-dd")}.pdf`)
}

// ── 8. Customers PDF ──

export async function exportCustomersPdf() {
  const supabase = createClient()

  const { data } = await supabase
    .from("customers")
    .select(
      `name, phone, email, address, notes, created_at,
      price_lists:price_lists(name, discount_percent)`
    )
    .is("deleted_at", null)
    .order("name")

  const customers = (data ?? []) as unknown as {
    name: string
    phone: string | null
    email: string | null
    address: string | null
    notes: string | null
    created_at: string
    price_lists: { name: string; discount_percent: number } | null
  }[]

  const withDiscount = customers.filter((c) => c.price_lists)

  const accent = ACCENT.pink

  const tableColumns = [
    { label: "Nombre", flex: 2 },
    { label: "Telefono" },
    { label: "Email", flex: 1.5 },
    { label: "Descuento" },
  ]

  const doc = (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Header
          title="Directorio de Clientes"
          subtitle={format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          accent={accent}
        />

        <KpiCards
          accent={accent}
          metrics={[
            { label: "Total clientes", value: String(customers.length) },
            { label: "Con descuento personalizado", value: String(withDiscount.length) },
          ]}
        />

        <SectionLabel text="Listado de clientes" accent={accent} />
        <TableHeader columns={tableColumns} accent={accent} />
        {customers.slice(0, 80).map((c, i) => (
          <TableRow
            key={i}
            index={i}
            cells={[
              c.name,
              c.phone ?? "—",
              c.email ?? "—",
              c.price_lists
                ? `${c.price_lists.name} (-${c.price_lists.discount_percent}%)`
                : "Precio base",
            ]}
            columns={[
              { flex: 2 },
              {},
              { flex: 1.5 },
              {},
            ]}
          />
        ))}

        {customers.length > 80 && (
          <Text style={{ fontSize: 7, color: N[500], marginTop: 6, textAlign: "center" }}>
            Mostrando 80 de {customers.length} clientes
          </Text>
        )}

        <Footer />
      </Page>
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `clientes-${format(new Date(), "yyyy-MM-dd")}.pdf`)
}

// ── 9. Products Catalog PDF ──

export async function exportProductsPdf() {
  const supabase = createClient()

  const { data } = await supabase
    .from("products")
    .select(
      `name, brand, is_active, has_variants,
      product_categories(categories(name)),
      product_variants(name, sku, price, stock, is_active)`
    )
    .is("deleted_at", null)
    .is("product_variants.deleted_at", null)
    .order("name")

  const products = data ?? []

  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.is_active).length

  let totalSKUs = 0
  let totalValue = 0
  for (const p of products) {
    const variants = (
      p.product_variants as {
        price: number
        stock: number
        is_active: boolean
      }[]
    ).filter((v) => v.is_active)
    totalSKUs += variants.length
    totalValue += variants.reduce(
      (s, v) => s + Number(v.price) * v.stock,
      0
    )
  }

  // Flatten products + variants into rows
  const rows: {
    producto: string
    marca: string
    categoria: string
    variante: string
    codigo: string
    precio: number
    stock: number
  }[] = []

  for (const p of products) {
    const variants = (
      p.product_variants as {
        name: string | null
        sku: string | null
        price: number
        stock: number
        is_active: boolean
      }[]
    ).filter((v) => v.is_active)

    const category = (
      (p.product_categories as unknown as { categories: { name: string } | null }[]) ?? []
    )
      .map((pc) => pc.categories?.name)
      .filter(Boolean)
      .join(", ")

    for (const v of variants) {
      rows.push({
        producto: p.name,
        marca: p.brand ?? "—",
        categoria: category || "—",
        variante: v.name ?? "—",
        codigo: v.sku ?? "—",
        precio: Number(v.price),
        stock: v.stock,
      })
    }
  }

  const accent = ACCENT.emerald

  const tableColumns = [
    { label: "Producto", flex: 2 },
    { label: "Marca" },
    { label: "Variante" },
    { label: "Codigo" },
    { label: "Precio", align: "right" as const },
    { label: "Stock", align: "right" as const },
  ]

  const doc = (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Header
          title="Catalogo de Productos"
          subtitle={format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          accent={accent}
        />

        <KpiCards
          accent={accent}
          metrics={[
            { label: "Total productos", value: String(totalProducts) },
            { label: "Activos", value: String(activeProducts) },
            { label: "SKUs activos", value: String(totalSKUs) },
            { label: "Valor en stock", value: currency(totalValue) },
          ]}
        />

        <SectionLabel text="Catalogo" accent={accent} />
        <TableHeader columns={tableColumns} accent={accent} />
        {rows.slice(0, 80).map((r, i) => (
          <TableRow
            key={i}
            index={i}
            cells={[
              r.producto,
              r.marca,
              r.variante,
              r.codigo,
              currency(r.precio),
              String(r.stock),
            ]}
            columns={[
              { flex: 2 },
              {},
              {},
              {},
              { align: "right" },
              { align: "right" },
            ]}
          />
        ))}

        {rows.length > 80 && (
          <Text style={{ fontSize: 7, color: N[500], marginTop: 6, textAlign: "center" }}>
            Mostrando 80 de {rows.length} variantes
          </Text>
        )}

        <Footer />
      </Page>
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `productos-${format(new Date(), "yyyy-MM-dd")}.pdf`)
}
