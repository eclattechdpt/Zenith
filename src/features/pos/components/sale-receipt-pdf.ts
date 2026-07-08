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
import { registerPdfFonts, PDF_FONT } from "@/lib/pdf-fonts"
import { formatDiscountPercent } from "@/lib/utils"
import type { ReceiptData } from "./sale-receipt"

// ── Register custom fonts ──
registerPdfFonts()

// ── Font aliases ──
const F = PDF_FONT
const FB = PDF_FONT

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
  violet: "#8b5cf6",
  violetBg: "#ede9fe",
  teal: "#22859A",
}

// Letter portrait con columna centrada angosta. El usuario quería el
// diseño colorido sobre hoja carta — no factura full-width. Content cap
// alrededor de 340pt, centrado con padding horizontal grande.
const PAGE_H_PAD = 136 // (612 - 340) / 2
const PAGE_V_PAD = 60

const s = StyleSheet.create({
  page: {
    paddingHorizontal: PAGE_H_PAD,
    paddingTop: PAGE_V_PAD,
    paddingBottom: PAGE_V_PAD,
    fontFamily: F,
    fontSize: 9,
    color: C.dark,
  },
  brandName: { fontSize: 22, fontFamily: FB, fontWeight: 700, color: C.black, letterSpacing: -0.5 },
  brandSub: { fontSize: 9, color: C.light, marginTop: 4, lineHeight: 1.6 },
  accentLine: { height: 2, backgroundColor: C.rose, borderRadius: 1, marginTop: 18, marginBottom: 20 },
  infoBox: { backgroundColor: C.bg, borderRadius: 6, padding: 12, marginBottom: 20 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  label: { fontSize: 8, color: C.light, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  folio: { fontSize: 14, fontFamily: FB, fontWeight: 700, color: C.black, letterSpacing: -0.3 },
  dateText: { fontSize: 9, color: C.mid, textAlign: "right" },
  timeText: { fontSize: 9, color: C.light, textAlign: "right" },
  clientBlock: { paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  clientHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  clientLabel: { fontSize: 8, color: C.light, textTransform: "uppercase", letterSpacing: 0.5 },
  clientName: { fontSize: 9.5, fontFamily: FB, fontWeight: 700, color: C.black, textAlign: "right", flexShrink: 1 },
  distributorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  distributorText: { fontSize: 8.5, fontWeight: 500, color: "#444", fontFamily: F },
  tableHeader: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 8 },
  tableHeaderText: { fontSize: 8, color: C.light, textTransform: "uppercase", letterSpacing: 0.5 },
  itemRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.lineFaint },
  itemRowLast: { paddingVertical: 6 },
  itemLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  itemName: { fontFamily: F, fontSize: 9.5, color: C.black, flexShrink: 1 },
  itemVariant: { fontSize: 8, color: C.light },
  itemQty: { fontSize: 8.5, color: C.mid, marginTop: 1 },
  itemTotal: { fontFamily: FB, fontWeight: 700, fontSize: 9.5, color: C.black },
  discountText: { fontSize: 8.5, color: C.rose },
  discountTextGift: { fontSize: 8.5, color: C.violet },
  subtotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  subtotalText: { fontSize: 9, color: C.mid },
  subtotalValue: { fontSize: 9, color: C.mid },
  discountsHeader: { fontSize: 9, color: C.mid, marginTop: 6, marginBottom: 2 },
  totalBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.roseBg, borderRadius: 6, padding: 12, marginTop: 12 },
  totalLabel: { fontSize: 11, fontFamily: FB, fontWeight: 700, color: C.black, textTransform: "uppercase", letterSpacing: 0.5 },
  totalValue: { fontSize: 16, fontFamily: FB, fontWeight: 700, color: C.black, letterSpacing: -0.5 },
  payBox: { backgroundColor: C.bgPay, borderRadius: 5, padding: 12, marginTop: 10 },
  payLabel: { fontSize: 8, color: C.light, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  payRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  payMethod: { fontSize: 9.5, color: C.mid },
  payAmount: { fontSize: 9.5, fontFamily: FB, fontWeight: 700, color: C.mid },
  payRef: { fontSize: 8.5, color: "#888", paddingLeft: 8, marginTop: 1 },
  changeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: C.line },
  changeText: { fontSize: 9.5, fontFamily: FB, fontWeight: 700, color: C.teal },
  footer: { textAlign: "center", paddingTop: 14, marginTop: 18, borderTopWidth: 1, borderTopColor: C.lineFaint },
  footerThanks: { fontSize: 9, color: C.mid, fontFamily: FB },
  footerPowered: { fontSize: 8, color: C.subtle, marginTop: 6 },
  footerAbbrix: { fontSize: 7.5, color: C.faint, marginTop: 4 },
})

function currency(n: number) {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const d = new Date(data.date)
  const formattedDate = format(d, "dd 'de' MMMM, yyyy", { locale: es })
  const formattedTime = format(d, "HH:mm", { locale: es })

  const withDiscount = data.items.filter((i) => i.discount > 0)
  const uniquePcts = new Set(
    withDiscount.map((i) => Number(i.discount_percent ?? 0))
  )
  // Si el sale.discount_amount agregado tiene una porción cart-level que no
  // viene de items (cart custom_amount + regalo individual, p.ej.), evita
  // mostrar un % engañoso en la línea agregada.
  const itemsDiscountSum = withDiscount.reduce((s, i) => s + i.discount, 0)
  const cartLevelExtra = Math.max(0, data.discountAmount - itemsDiscountSum)
  const hasCartLevelExtra = cartLevelExtra > 0.01
  const sameDiscountForAll =
    uniquePcts.size === 1 && [...uniquePcts][0] > 0 && !hasCartLevelExtra

  return h(Document, null,
    h(Page, { size: "LETTER", style: s.page },
      // ── Branding ──
      h(Text, { style: s.brandName }, "Éclat"),
      h(Text, { style: s.brandSub }, `Eclat · Zapopan, Jalisco\nTel. 33 1234 5678`),
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
          ? h(View, { style: s.clientBlock },
              h(View, { style: s.clientHeader },
                h(Text, { style: s.clientLabel }, "Cliente"),
                h(Text, { style: s.clientName }, data.customerName),
              ),
              data.customerNumber
                ? h(View, { style: s.distributorRow },
                    h(Text, { style: { ...s.clientLabel, fontSize: 7.5 } }, "Nº Distribuidor"),
                    h(Text, { style: s.distributorText }, data.customerNumber),
                  )
                : null,
            )
          : null,
      ),

      // ── Items table ──
      h(View, { style: { marginBottom: 4 } },
        h(View, { style: s.tableHeader },
          h(Text, { style: s.tableHeaderText }, "Producto"),
          h(Text, { style: s.tableHeaderText }, "Importe"),
        ),
        ...data.items.map((item, i) => {
          const hasDiscount = item.discount > 0
          const isGift = hasDiscount && item.line_total === 0
          const pctLabel =
            item.discount_percent != null && item.discount_percent > 0
              ? formatDiscountPercent(
                  item.discount,
                  item.unit_price * item.quantity,
                  item.discount_percent
                )
              : null
          return h(
            View,
            { key: String(i), style: i < data.items.length - 1 ? s.itemRow : s.itemRowLast },
            h(View, { style: s.itemLine },
              h(View, { style: { flex: 1, paddingRight: 8 } },
                h(Text, { style: s.itemName }, item.product_name),
                item.variant_label !== item.product_name
                  ? h(Text, { style: s.itemVariant }, item.variant_label)
                  : null,
                hasDiscount
                  ? h(View, { style: { flexDirection: "row", gap: 4, marginTop: 1 } },
                      h(Text, { style: { ...s.itemQty, textDecoration: "line-through", color: "#bbb" } },
                        `${item.quantity} x ${currency(item.unit_price)}`),
                      pctLabel
                        ? h(Text, { style: { ...s.discountText, fontWeight: 600 } }, `-${pctLabel}`)
                        : null,
                    )
                  : h(Text, { style: s.itemQty }, `${item.quantity} x ${currency(item.unit_price)}`),
              ),
              h(
                Text,
                { style: isGift ? { ...s.itemTotal, color: C.violet } : s.itemTotal },
                isGift ? "GRATIS" : currency(item.line_total)
              ),
            ),
          )
        }),

        // Subtotal
        h(View, { style: s.subtotalRow },
          h(Text, { style: s.subtotalText }, "Subtotal"),
          h(Text, { style: s.subtotalValue }, currency(data.subtotal)),
        ),
        // Descuentos — 3 casos como en el receipt HTML
        data.discountAmount > 0
          ? (() => {
              // A) Cart-level (custom_amount) sin per-item → 1 línea
              if (withDiscount.length === 0) {
                const pct = formatDiscountPercent(
                  data.discountAmount,
                  data.subtotal,
                  data.discountPercent
                )
                return h(View, { style: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 } },
                  h(Text, { style: s.discountText }, pct ? `Descuento (${pct})` : "Descuento"),
                  h(Text, { style: s.discountText }, `-${currency(data.discountAmount)}`),
                )
              }
              // B) Todos los items con el mismo % → 1 línea agregada
              if (sameDiscountForAll) {
                const pct = formatDiscountPercent(
                  data.discountAmount,
                  data.subtotal,
                  [...uniquePcts][0]
                )
                return h(View, { style: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 } },
                  h(Text, { style: s.discountText }, pct ? `Descuento (${pct})` : "Descuento"),
                  h(Text, { style: s.discountText }, `-${currency(data.discountAmount)}`),
                )
              }
              // C) % distintos o hay extra cart-level → 1 línea por producto
              return h(View, null,
                ...withDiscount.map((item, i) => {
                  const pct = Number(item.discount_percent ?? 0)
                  const isGift = pct === 100
                  const style = isGift ? s.discountTextGift : s.discountText
                  return h(View, {
                    key: `disc-${i}`,
                    style: { flexDirection: "row", justifyContent: "space-between", marginTop: i === 0 ? 3 : 2, gap: 6 },
                  },
                    h(Text, { style: { ...style, flex: 1 } },
                      `${isGift ? "★" : "%"} ${item.product_name}${pct > 0 ? ` (${pct}%)` : ""}${isGift ? "  REGALO" : ""}`,
                    ),
                    h(Text, { style }, `-${currency(item.discount)}`),
                  )
                }),
                hasCartLevelExtra
                  ? h(View, {
                      style: { flexDirection: "row", justifyContent: "space-between", marginTop: 2, gap: 6 },
                    },
                      h(Text, { style: { ...s.discountText, flex: 1 } }, "Descuento adicional"),
                      h(Text, { style: s.discountText }, `-${currency(cartLevelExtra)}`),
                    )
                  : null,
              )
            })()
          : null,
        // Cargo extra (ej. servicio a domicilio) — SUMA al total
        (data.extraAmount ?? 0) > 0
          ? h(View, { style: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 } },
              h(Text, { style: s.subtotalText }, data.extraLabel?.trim() || "Servicio a domicilio"),
              h(Text, { style: s.subtotalValue }, `+${currency(data.extraAmount ?? 0)}`),
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
          ...data.payments.flatMap((p, i) => {
            const row = h(View, { key: `pay-${i}`, style: s.payRow },
              h(Text, { style: s.payMethod },
                PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ?? p.method,
              ),
              h(Text, { style: s.payAmount }, currency(p.amount)),
            )
            if (!p.reference) return [row]
            // Sin fontStyle italic — PlusJakarta no registra italic variant.
            const note = h(Text, { key: `ref-${i}`, style: s.payRef }, `Nota: ${p.reference}`)
            return [row, note]
          }),
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
  const win = window.open(url, "_blank")
  if (win) {
    win.addEventListener("afterprint", () => {
      win.close()
      URL.revokeObjectURL(url)
    })
    setTimeout(() => URL.revokeObjectURL(url), 300000)
  }
}
