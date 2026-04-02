import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import { format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"

import { createClient } from "@/lib/supabase/client"
import { SALE_STATUSES, PAYMENT_METHODS } from "@/lib/constants"

const VALID_STATUSES = ["completed", "partially_returned", "fully_returned"]
const BUSINESS_NAME = "Eclat"

// ── Shared styles ──

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#F43F6B",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#1a1a1a",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    backgroundColor: "#f9f9f9",
  },
  cell: {
    flex: 1,
    fontSize: 9,
  },
  cellRight: {
    flex: 1,
    fontSize: 9,
    textAlign: "right",
  },
  cellBold: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  metric: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: "#666",
  },
  metricValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#bbb",
    textAlign: "center",
  },
})

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

// ── Sales Report PDF ──

export async function exportSalesPdf() {
  const supabase = createClient()
  const monthStart = startOfMonth(new Date())

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
    .order("created_at", { ascending: false })

  const salesList = sales ?? []
  const totalRevenue = salesList.reduce(
    (s, r) => s + Number(r.total ?? 0),
    0
  )
  const avgTicket =
    salesList.length > 0 ? totalRevenue / salesList.length : 0

  // Payment method breakdown
  const methodTotals: Record<string, number> = {}
  for (const s of salesList) {
    for (const p of (s.sale_payments as { method: string; amount: number }[]) ??
      []) {
      methodTotals[p.method] = (methodTotals[p.method] ?? 0) + Number(p.amount)
    }
  }

  const dateRange = `${format(monthStart, "d 'de' MMMM", { locale: es })} — ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`

  const doc = (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {BUSINESS_NAME} — Reporte de Ventas
          </Text>
          <Text style={styles.subtitle}>{dateRange}</Text>
        </View>

        {/* Summary metrics */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total ventas</Text>
          <Text style={styles.metricValue}>{currency(totalRevenue)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Transacciones</Text>
          <Text style={styles.metricValue}>{salesList.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Ticket promedio</Text>
          <Text style={styles.metricValue}>{currency(avgTicket)}</Text>
        </View>

        {/* Payment breakdown */}
        <Text style={styles.sectionTitle}>Por metodo de pago</Text>
        {Object.entries(methodTotals).map(([method, total]) => (
          <View key={method} style={styles.metric}>
            <Text style={styles.metricLabel}>
              {PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS] ??
                method}
            </Text>
            <Text style={styles.metricValue}>{currency(total)}</Text>
          </View>
        ))}

        {/* Sales table */}
        <Text style={styles.sectionTitle}>Detalle de ventas</Text>
        <View style={styles.headerRow}>
          <Text style={styles.cellBold}>Numero</Text>
          <Text style={styles.cellBold}>Estado</Text>
          <Text style={styles.cellBold}>Cliente</Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>
            Total
          </Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>
            Fecha
          </Text>
        </View>
        {salesList.slice(0, 50).map((s) => (
          <View key={s.sale_number} style={styles.row}>
            <Text style={styles.cell}>{s.sale_number}</Text>
            <Text style={styles.cell}>
              {SALE_STATUSES[s.status as keyof typeof SALE_STATUSES] ??
                s.status}
            </Text>
            <Text style={styles.cell}>
              {(s.customers as unknown as { name: string } | null)?.name ??
                "—"}
            </Text>
            <Text style={styles.cellRight}>
              {currency(Number(s.total))}
            </Text>
            <Text style={styles.cellRight}>
              {format(new Date(s.created_at), "dd/MM/yy")}
            </Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Generado por Zenith POS — {format(new Date(), "dd/MM/yyyy HH:mm")}
        </Text>
      </Page>
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `reporte-ventas-${format(new Date(), "yyyy-MM-dd")}.pdf`)
}

// ── Inventory Fisico Report PDF ──

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

  const variants = (data ?? []) as unknown as {
    sku: string | null
    name: string | null
    price: number
    stock: number
    stock_min: number
    products: { name: string; brand: string | null }[]
  }[]

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

  const doc = (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {BUSINESS_NAME} — Inventario Fisico
          </Text>
          <Text style={styles.subtitle}>
            {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          </Text>
        </View>

        {/* Summary */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total SKUs activos</Text>
          <Text style={styles.metricValue}>{totalSKUs}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Valor total en stock</Text>
          <Text style={styles.metricValue}>{currency(totalValue)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Alertas stock bajo</Text>
          <Text style={styles.metricValue}>{low.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Alertas stock critico</Text>
          <Text style={styles.metricValue}>{critical.length}</Text>
        </View>

        {/* Full inventory table */}
        <Text style={styles.sectionTitle}>Inventario completo</Text>
        <View style={styles.headerRow}>
          <Text style={{ ...styles.cellBold, flex: 2 }}>Producto</Text>
          <Text style={styles.cellBold}>Variante</Text>
          <Text style={styles.cellBold}>Codigo</Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>
            Precio
          </Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>
            Stock
          </Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>
            Min
          </Text>
        </View>
        {variants.slice(0, 80).map((v, i) => (
          <View key={i} style={styles.row}>
            <Text style={{ ...styles.cell, flex: 2 }}>
              {v.products[0]?.name ?? "—"}
            </Text>
            <Text style={styles.cell}>{v.name ?? "—"}</Text>
            <Text style={styles.cell}>{v.sku ?? "—"}</Text>
            <Text style={styles.cellRight}>
              {currency(Number(v.price))}
            </Text>
            <Text style={styles.cellRight}>{v.stock}</Text>
            <Text style={styles.cellRight}>{v.stock_min}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Generado por Zenith POS — {format(new Date(), "dd/MM/yyyy HH:mm")}
        </Text>
      </Page>
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  downloadBlob(
    blob,
    `inventario-fisico-${format(new Date(), "yyyy-MM-dd")}.pdf`
  )
}

// ── Transit Inventory Report PDF ──

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

  const MONTH_NAMES = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]

  const totalValue = weeksList.reduce(
    (s, w) => s + Number(w.total_value ?? 0), 0
  )

  const doc = (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {BUSINESS_NAME} — Inventario en Transito
          </Text>
          <Text style={styles.subtitle}>
            {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total semanas registradas</Text>
          <Text style={styles.metricValue}>{weeksList.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Valor total en transito</Text>
          <Text style={styles.metricValue}>{currency(totalValue)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Detalle por semana</Text>
        <View style={styles.headerRow}>
          <Text style={styles.cellBold}>Periodo</Text>
          <Text style={{ ...styles.cellBold, flex: 2 }}>Producto</Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>Cant.</Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>Precio</Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>Total</Text>
        </View>
        {weeksList.slice(0, 40).map((week) => {
          const items = week.transit_week_items ?? []
          if (items.length === 0) {
            return (
              <View key={`${week.year}-${week.month}-${week.week_number}`} style={styles.row}>
                <Text style={styles.cell}>
                  {MONTH_NAMES[week.month]} S{week.week_number} ({week.year})
                </Text>
                <Text style={{ ...styles.cell, flex: 2 }}>Sin productos</Text>
                <Text style={styles.cellRight}>—</Text>
                <Text style={styles.cellRight}>—</Text>
                <Text style={styles.cellRight}>{currency(Number(week.total_value))}</Text>
              </View>
            )
          }
          return items.map((item, i) => (
            <View key={`${week.year}-${week.month}-${week.week_number}-${i}`} style={styles.row}>
              <Text style={styles.cell}>
                {i === 0
                  ? `${MONTH_NAMES[week.month]} S${week.week_number} (${week.year})`
                  : ""}
              </Text>
              <Text style={{ ...styles.cell, flex: 2 }}>
                {item.product_variants?.products?.name ?? "—"}{" "}
                {item.product_variants?.name ? `(${item.product_variants.name})` : ""}
              </Text>
              <Text style={styles.cellRight}>{item.quantity}</Text>
              <Text style={styles.cellRight}>{currency(Number(item.unit_price))}</Text>
              <Text style={styles.cellRight}>{currency(Number(item.line_total))}</Text>
            </View>
          ))
        })}

        <Text style={styles.footer}>
          Generado por Zenith POS — {format(new Date(), "dd/MM/yyyy HH:mm")}
        </Text>
      </Page>
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `inventario-transito-${format(new Date(), "yyyy-MM-dd")}.pdf`)
}

// ── Initial Load Report PDF ──

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
    products: { name: string; brand: string | null }[]
  }[])
    .filter((v) => v.initial_stock !== null && v.initial_stock > 0)
    .map((v) => {
      const override = overrideMap.get(v.id)
      const prodName = override?.override_name ?? v.products[0]?.name ?? "—"
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

  const doc = (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {BUSINESS_NAME} — Inventario Carga Inicial
          </Text>
          <Text style={styles.subtitle}>
            {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total productos</Text>
          <Text style={styles.metricValue}>{items.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total unidades</Text>
          <Text style={styles.metricValue}>{totalUnits}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Valor total</Text>
          <Text style={styles.metricValue}>{currency(totalValue)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Detalle</Text>
        <View style={styles.headerRow}>
          <Text style={{ ...styles.cellBold, flex: 2 }}>Producto</Text>
          <Text style={styles.cellBold}>Variante</Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>Stock</Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>Precio</Text>
          <Text style={{ ...styles.cellBold, textAlign: "right" }}>Valor</Text>
        </View>
        {items.slice(0, 80).map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={{ ...styles.cell, flex: 2 }}>
              {item.producto}{item.editado ? " *" : ""}
            </Text>
            <Text style={styles.cell}>{item.variante}</Text>
            <Text style={styles.cellRight}>{item.stock}</Text>
            <Text style={styles.cellRight}>{currency(item.precio)}</Text>
            <Text style={styles.cellRight}>{currency(item.valor)}</Text>
          </View>
        ))}

        {items.some((i) => i.editado) && (
          <Text style={{ fontSize: 8, color: "#999", marginTop: 8 }}>
            * Nombre o precio editado manualmente
          </Text>
        )}

        <Text style={styles.footer}>
          Generado por Zenith POS — {format(new Date(), "dd/MM/yyyy HH:mm")}
        </Text>
      </Page>
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  downloadBlob(blob, `carga-inicial-${format(new Date(), "yyyy-MM-dd")}.pdf`)
}
