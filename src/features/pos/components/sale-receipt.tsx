import { forwardRef } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { formatCurrency, formatDiscountPercent } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/constants"

interface ReceiptItem {
  product_name: string
  variant_label: string
  quantity: number
  unit_price: number
  discount: number
  discount_percent?: number | null
  line_total: number
}

interface ReceiptPayment {
  method: string
  amount: number
  reference?: string | null
}

export interface ReceiptData {
  saleNumber: string
  date: string
  customerName: string | null
  customerNumber: string | null
  items: ReceiptItem[]
  payments: ReceiptPayment[]
  subtotal: number
  discountAmount: number
  discountPercent?: number | null
  total: number
  change: number
}

const BUSINESS_NAME = "ECLAT"
const BUSINESS_PHONE = "33 3167 7771"
const BUSINESS_LOCATION = "Zapopan, Jalisco"

// Estilo "ticket térmico" optimizado para legibilidad en impresoras térmicas de
// 80mm (área imprimible real ~72mm, 203 DPI, 1-bit: negro puro o nada).
// Reglas que mantienen el texto NÍTIDO en papel térmico:
//   1. Ancho del contenido = 72mm (no 80mm) para no caer en el margen no
//      imprimible (~4mm/lado) y que no se corten los bordes.
//   2. Sans-serif PESADO (no monospace fino): los trazos gruesos sobreviven la
//      binarización; la alineación la maneja flexbox, no el monospace.
//   3. Peso base 600 y énfasis 800 — el 400 sale débil/entrecortado.
//   4. Tamaños grandes (nada < 11px) — a 203 DPI lo chico se desbarata.
//   5. Separadores como REGLA SÓLIDA negra (no guiones ni grises).
//   6. Sin grises, sin fondos, sin logos diminutos (texto en su lugar).

const FONT_FAMILY = "Arial, Helvetica, 'Segoe UI', system-ui, sans-serif"

// Util: row con label a la izquierda + value tabular a la derecha
function Row({
  label,
  value,
  bold = false,
  size = 13,
}: {
  label: React.ReactNode
  value: React.ReactNode
  bold?: boolean
  size?: number
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        fontSize: `${size}px`,
        fontWeight: bold ? 800 : 600,
        lineHeight: 1.45,
      }}
    >
      <span style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {value}
      </span>
    </div>
  )
}

// Separador = línea negra sólida (lo más nítido en térmica)
function Separator() {
  return <div style={{ borderTop: "2px solid #000", margin: "10px 0" }} />
}

export const SaleReceipt = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  function SaleReceipt({ data }, ref) {
    const formattedDate = format(new Date(data.date), "dd/MM/yyyy", { locale: es })
    const formattedTime = format(new Date(data.date), "HH:mm", { locale: es })

    const withDiscount = data.items.filter((i) => i.discount > 0)
    const uniquePcts = new Set(
      withDiscount.map((i) => Number(i.discount_percent ?? 0))
    )
    // Detecta cuándo el descuento agregado del sale incluye una porción que NO
    // viene de items (típicamente cart-level `custom_amount` + algún regalo
    // individual). Sin esto, el branch "mismo % en todos" mostraría un
    // porcentaje engañoso porque `data.discountAmount` ya incluye el extra.
    const itemsDiscountSum = withDiscount.reduce((s, i) => s + i.discount, 0)
    const cartLevelExtra = Math.max(0, data.discountAmount - itemsDiscountSum)
    const hasCartLevelExtra = cartLevelExtra > 0.01
    const sameDiscountForAll =
      uniquePcts.size === 1 && [...uniquePcts][0] > 0 && !hasCartLevelExtra

    const totalPieces = data.items.reduce((sum, i) => sum + i.quantity, 0)

    return (
      <div
        ref={ref}
        style={{
          width: "72mm",
          margin: "0 auto",
          padding: "18px 8px",
          fontFamily: FONT_FAMILY,
          fontSize: "13px",
          fontWeight: 600,
          color: "#000",
          lineHeight: 1.45,
          background: "#fff",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/EclatLogo_Black.svg"
            alt={BUSINESS_NAME}
            style={{
              display: "block",
              margin: "0 auto 8px",
              width: "42mm",
              maxWidth: "100%",
              height: "auto",
            }}
          />
          <div style={{ fontSize: "12px", fontWeight: 600 }}>
            {BUSINESS_LOCATION}
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600 }}>
            Tel. {BUSINESS_PHONE}
          </div>
        </div>

        <Separator />

        {/* ── Sale info ── */}
        <Row
          label={<span style={{ fontWeight: 800 }}>FOLIO</span>}
          value={<span style={{ fontWeight: 800 }}>{data.saleNumber}</span>}
          bold
        />
        <Row label="Fecha" value={`${formattedDate} ${formattedTime}`} />

        {data.customerName && (
          <div style={{ marginTop: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: 800 }}>CLIENTE</div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                wordBreak: "break-word",
              }}
            >
              {data.customerName}
            </div>
            {data.customerNumber && (
              <Row
                label="Nº Distribuidor"
                value={data.customerNumber}
                size={12}
              />
            )}
          </div>
        )}

        <Separator />

        {/* ── Items ── */}
        <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "6px" }}>
          PRODUCTOS
        </div>

        {data.items.map((item, i) => {
          const hasDiscount = item.discount > 0
          const isGift = hasDiscount && item.line_total === 0
          const gross = item.unit_price * item.quantity
          const pctLabel =
            item.discount_percent != null && item.discount_percent > 0
              ? formatDiscountPercent(item.discount, gross, item.discount_percent)
              : null
          // Etiqueta del descuento: "%" si lo tenemos, si no el monto en $.
          const discountLabel = pctLabel ?? formatCurrency(item.discount)

          return (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  wordBreak: "break-word",
                }}
              >
                {item.product_name}
              </div>
              {item.variant_label !== item.product_name && (
                <div style={{ fontSize: "12px", fontWeight: 600 }}>
                  {item.variant_label}
                </div>
              )}

              {hasDiscount ? (
                <>
                  {/* Cantidad x Precio = Subtotal del renglón (izquierda) */}
                  <div style={{ fontSize: "12px", fontWeight: 600 }}>
                    {item.quantity} x {formatCurrency(item.unit_price)} ={" "}
                    {formatCurrency(gross)}
                  </div>
                  {/* - Descuento (izquierda) · Total con descuento (derecha) */}
                  <Row
                    size={12}
                    bold
                    label={
                      <span style={{ fontWeight: 800 }}>
                        - {discountLabel}
                        {isGift && " REGALO"}
                      </span>
                    }
                    value={
                      <span style={{ fontWeight: 800 }}>
                        {isGift ? "GRATIS" : formatCurrency(item.line_total)}
                      </span>
                    }
                  />
                </>
              ) : (
                /* Sin descuento: Cantidad x Precio (izquierda) · Total (derecha) */
                <Row
                  size={12}
                  label={
                    <span style={{ fontWeight: 600 }}>
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </span>
                  }
                  value={
                    <span style={{ fontWeight: 800 }}>
                      {formatCurrency(item.line_total)}
                    </span>
                  }
                />
              )}
            </div>
          )
        })}

        <Separator />

        {/* ── Totals ── */}
        <Row label="Subtotal" value={formatCurrency(data.subtotal)} />

        {data.discountAmount > 0 && (() => {
          // 3 casos:
          // A) Sin items con descuento → es cart-level (custom_amount). Línea simple.
          // B) Todos los items con el mismo % → línea agregada con %.
          // C) % distintos entre items → header DESCUENTOS + 1 línea por producto.
          if (withDiscount.length === 0) {
            const pct = formatDiscountPercent(
              data.discountAmount,
              data.subtotal,
              data.discountPercent
            )
            return (
              <Row
                label={`Descuento${pct ? ` (${pct})` : ""}`}
                value={`-${formatCurrency(data.discountAmount)}`}
              />
            )
          }

          if (sameDiscountForAll) {
            const pct = formatDiscountPercent(
              data.discountAmount,
              data.subtotal,
              [...uniquePcts][0]
            )
            return (
              <Row
                label={`Descuento${pct ? ` (${pct})` : ""}`}
                value={`-${formatCurrency(data.discountAmount)}`}
              />
            )
          }

          return (
            <>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  marginTop: "6px",
                }}
              >
                DESCUENTOS
              </div>
              {withDiscount.map((item, i) => {
                const pct = Number(item.discount_percent ?? 0)
                const isGift = pct === 100
                return (
                  <Row
                    key={i}
                    label={
                      <span style={{ fontSize: "12px" }}>
                        {item.product_name}
                        {pct > 0 && (
                          <span style={{ fontWeight: 800 }}> ({pct}%)</span>
                        )}
                        {isGift && (
                          <span style={{ fontWeight: 800 }}> REGALO</span>
                        )}
                      </span>
                    }
                    value={`-${formatCurrency(item.discount)}`}
                    size={12}
                  />
                )
              })}
              {hasCartLevelExtra && (
                <Row
                  label={<span style={{ fontSize: "12px" }}>Descuento adicional</span>}
                  value={`-${formatCurrency(cartLevelExtra)}`}
                  size={12}
                />
              )}
            </>
          )
        })()}

        <Separator />

        {/* ── Total ── */}
        <Row
          label="Piezas"
          value={totalPieces}
        />
        <Row
          label={<span style={{ fontSize: "20px", fontWeight: 800 }}>TOTAL</span>}
          value={
            <span style={{ fontSize: "20px", fontWeight: 800 }}>
              {formatCurrency(data.total)}
            </span>
          }
        />

        <Separator />

        {/* ── Payments ── */}
        <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "4px" }}>
          FORMA DE PAGO
        </div>
        {data.payments.map((p, i) => (
          <div key={i}>
            <Row
              label={
                PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ??
                p.method
              }
              value={formatCurrency(p.amount)}
            />
            {p.reference && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  paddingLeft: "8px",
                }}
              >
                Ref: {p.reference}
              </div>
            )}
          </div>
        ))}
        {data.change > 0 && (
          <Row
            label={<span style={{ fontWeight: 800 }}>Cambio</span>}
            value={<span style={{ fontWeight: 800 }}>{formatCurrency(data.change)}</span>}
          />
        )}

        <Separator />

        {/* ── Footer ── */}
        <div
          style={{
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 600,
            marginTop: "10px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "8px" }}>
            GRACIAS POR TU COMPRA
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600 }}>
            Powered by ECLAT POS
          </div>
          <div style={{ fontSize: "11px", fontWeight: 600 }}>
            Desarrollado por Abbrix
          </div>
        </div>
      </div>
    )
  }
)
