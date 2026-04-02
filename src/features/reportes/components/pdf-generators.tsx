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

// ── Inventory Report PDF ──

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
            {BUSINESS_NAME} — Reporte de Inventario
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
    `reporte-inventario-${format(new Date(), "yyyy-MM-dd")}.pdf`
  )
}
