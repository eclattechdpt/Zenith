import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createElement as h } from "react"

import { PAYMENT_METHODS } from "@/lib/constants"
import type { ReceiptData } from "./sale-receipt"

// ── Fonts (built-in Helvetica) ──
const F = "Helvetica"
const FB = "Helvetica-Bold"

// ── Colors ──
const C = {
  black: "#1A1714",
  dark: "#302B27",
  mid: "#666666",
  light: "#999999",
  subtle: "#bbbbbb",
  faint: "#cccccc",
  line: "#e5e5e5",
  lineFaint: "#f0f0f0",
  bg: "#f9f9f9",
  bgPay: "#fafafa",
  rose: "#F43F6B",
  roseBg: "#FFF0F3",
  roseBgEnd: "#FFE0E8",
  teal: "#22859A",
}

// ── Page width: 80mm = 226.77pt ──
const W = 226.77
const PAD = 20

const s = StyleSheet.create({
  page: {
    paddingHorizontal: PAD,
    paddingTop: 28,
    paddingBottom: 20,
    fontFamily: F,
    fontSize: 9,
    color: C.dark,
    width: W,
  },
  brandName: { fontSize: 14, fontFamily: FB, color: C.black, letterSpacing: -0.3 },
  brandSub: { fontSize: 7.5, color: C.light, marginTop: 4, lineHeight: 1.6 },
  accentLine: { height: 2, backgroundColor: C.rose, borderRadius: 1, marginTop: 16, marginBottom: 18 },
  infoBox: { backgroundColor: C.bg, borderRadius: 6, padding: 10, marginBottom: 18 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  label: { fontSize: 7.5, color: C.light, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  folio: { fontSize: 13, fontFamily: FB, color: C.black, letterSpacing: -0.3 },
  dateText: { fontSize: 8.5, color: C.mid, textAlign: "right" },
  timeText: { fontSize: 8.5, color: C.light, textAlign: "right" },
  clientRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: C.line },
  clientLabel: { fontSize: 7.5, color: C.light, textTransform: "uppercase", letterSpacing: 0.5 },
  clientName: { fontSize: 9, fontFamily: FB, color: C.black },
  tableHeader: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 6 },
  tableHeaderText: { fontSize: 7.5, color: C.light, textTransform: "uppercase", letterSpacing: 0.5 },
  itemRow: { paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.lineFaint },
  itemRowLast: { paddingVertical: 5 },
  itemLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  itemName: { fontFamily: F, fontSize: 9, color: C.black },
  itemVariant: { fontSize: 7.5, color: C.light },
  itemQty: { fontSize: 8, color: C.mid, marginTop: 1 },
  itemTotal: { fontFamily: FB, fontSize: 9, color: C.black },
  discountLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  discountText: { fontSize: 8, color: C.rose },
  subtotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  subtotalText: { fontSize: 9, color: C.mid },
  subtotalValue: { fontSize: 9, color: C.mid },
  totalBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.roseBg, borderRadius: 6, padding: 10, marginTop: 10 },
  totalLabel: { fontSize: 10, fontFamily: FB, color: C.black, textTransform: "uppercase", letterSpacing: 0.5 },
  totalValue: { fontSize: 15, fontFamily: FB, color: C.black, letterSpacing: -0.5 },
  payBox: { backgroundColor: C.bgPay, borderRadius: 5, padding: 10, marginTop: 8 },
  payLabel: { fontSize: 7.5, color: C.light, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 },
  payRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  payMethod: { fontSize: 9, color: C.mid },
  payAmount: { fontSize: 9, fontFamily: FB, color: C.mid },
  changeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: C.line },
  changeText: { fontSize: 9, fontFamily: FB, color: C.teal },
  footer: { textAlign: "center", paddingTop: 12, marginTop: 16, borderTopWidth: 1, borderTopColor: C.lineFaint },
  footerThanks: { fontSize: 8.5, color: C.mid, fontFamily: FB },
  footerPowered: { fontSize: 7.5, color: C.subtle, marginTop: 5 },
  footerAbbrix: { fontSize: 7, color: C.faint, marginTop: 4 },
})

function currency(n: number) {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function estimateHeight(data: ReceiptData): number {
  const base = 28 + 30 + 2 + 18  // paddingTop + brand + accentLine + gap
    + 40 + (data.customerName ? 24 : 0) + 18  // infoBox + customer + gap
    + 20 // table header
    + 30 + 10 // subtotal row + gap
    + (data.discountAmount > 0 ? 16 : 0)
    + 40 + 50 // total box + payment box base
    + 16 + 50 + 20 // footer padding + footer + paddingBottom
  const itemsH = data.items.length * 38 // ~38pt per item (name + variant + qty)
  const paymentsH = data.payments.length * 16
  const changeH = data.change > 0 ? 20 : 0
  return base + itemsH + paymentsH + changeH
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const d = new Date(data.date)
  const formattedDate = format(d, "dd 'de' MMMM, yyyy", { locale: es })
  const formattedTime = format(d, "HH:mm", { locale: es })
  const pageHeight = Math.max(300, estimateHeight(data))

  return h(Document, null,
    h(Page, { size: [W, pageHeight], style: s.page, dpi: 72 },
      // ── Branding ──
      h(Text, { style: s.brandName }, "Éclat"),
      h(Text, { style: s.brandSub }, `Eclat \u00B7 Zapopan, Jalisco\nTel. 33 1234 5678`),
      h(View, { style: s.accentLine }),

      // ── Info box ──
      h(View, { style: s.infoBox },
        h(View, { style: s.infoRow },
          h(View, null,
            h(Text, { style: s.label }, "Folio"),
            h(Text, { style: s.folio }, data.saleNumber),
          ),
          h(View, null,
            h(Text, { style: s.dateText }, formattedDate),
            h(Text, { style: s.timeText }, `${formattedTime} hrs`),
          ),
        ),
        data.customerName
          ? h(View, { style: s.clientRow },
              h(Text, { style: s.clientLabel }, "Cliente"),
              h(Text, { style: s.clientName }, data.customerName),
            )
          : null,
      ),

      // ── Items table ──
      h(View, { style: { marginBottom: 4 } },
        h(View, { style: s.tableHeader },
          h(Text, { style: s.tableHeaderText }, "Producto"),
          h(Text, { style: s.tableHeaderText }, "Importe"),
        ),
        ...data.items.map((item, i) =>
          h(View, { key: String(i), style: i < data.items.length - 1 ? s.itemRow : s.itemRowLast },
            h(View, { style: s.itemLine },
              h(View, { style: { flex: 1, paddingRight: 8 } },
                h(Text, { style: s.itemName }, item.product_name),
                item.variant_label !== item.product_name
                  ? h(Text, { style: s.itemVariant }, item.variant_label)
                  : null,
                h(Text, { style: s.itemQty }, `${item.quantity} x ${currency(item.unit_price)}`),
              ),
              h(Text, { style: s.itemTotal }, currency(item.line_total)),
            ),
            item.discount > 0
              ? h(View, { style: s.discountLine },
                  h(Text, { style: s.discountText }, "Descuento"),
                  h(Text, { style: s.discountText }, `-${currency(item.discount)}`),
                )
              : null,
          ),
        ),

        // Subtotal
        h(View, { style: s.subtotalRow },
          h(Text, { style: s.subtotalText }, "Subtotal"),
          h(Text, { style: s.subtotalValue }, currency(data.subtotal)),
        ),
        data.discountAmount > 0
          ? h(View, { style: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 } },
              h(Text, { style: s.discountText }, "Descuento"),
              h(Text, { style: s.discountText }, `-${currency(data.discountAmount)}`),
            )
          : null,
      ),

      // ── Total + Payments ──
      h(View, { style: { marginBottom: 4 } },
        h(View, { style: s.totalBox },
          h(Text, { style: s.totalLabel }, "Total"),
          h(Text, { style: s.totalValue }, currency(data.total)),
        ),
        h(View, { style: s.payBox },
          h(Text, { style: s.payLabel }, "Forma de pago"),
          ...data.payments.map((p, i) =>
            h(View, { key: String(i), style: s.payRow },
              h(Text, { style: s.payMethod },
                PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ?? p.method,
              ),
              h(Text, { style: s.payAmount }, currency(p.amount)),
            ),
          ),
          data.change > 0
            ? h(View, { style: s.changeRow },
                h(Text, { style: s.changeText }, "Cambio"),
                h(Text, { style: s.changeText }, currency(data.change)),
              )
            : null,
        ),
      ),

      // ── Footer ──
      h(View, { style: s.footer },
        h(Text, { style: s.footerThanks }, "Gracias por tu compra"),
        h(Text, { style: s.footerPowered }, "Powered by Eclat POS"),
        h(Text, { style: s.footerAbbrix }, "Desarrollado por Abbrix"),
      ),
    ),
  )
}

async function generateReceiptBlob(data: ReceiptData): Promise<Blob> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = h(ReceiptDocument, { data }) as any
  return pdf(doc).toBlob()
}

export async function downloadReceiptPdf(data: ReceiptData) {
  const blob = await generateReceiptBlob(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `Recibo-${data.saleNumber}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export async function printReceiptPdf(data: ReceiptData) {
  const blob = await generateReceiptBlob(data)
  const url = URL.createObjectURL(blob)
  // Open in new tab — Chrome's PDF viewer respects the PDF page size
  const win = window.open(url, "_blank")
  if (win) {
    // Auto-trigger print once the PDF loads
    win.addEventListener("afterprint", () => {
      win.close()
      URL.revokeObjectURL(url)
    })
    // Fallback: revoke after 5 minutes if user closes tab manually
    setTimeout(() => URL.revokeObjectURL(url), 300000)
  }
}
