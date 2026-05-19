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
const BUSINESS_PHONE = "33 1234 5678"
const BUSINESS_LOCATION = "Zapopan, Jalisco"

// Estilo "ticket térmico": monospace, puro negro y blanco, sin fondos.
// Las impresoras térmicas no reproducen fondos coloridos, los renderizan
// como gris claro que se desvanece. Bold contra regular es lo único que
// se ve nítido en papel térmico.

const FONT_FAMILY =
  "'JetBrains Mono', 'Menlo', 'Courier New', Courier, monospace"

const SEPARATOR = "--------------------------------"

// Util: row con label a la izquierda + value tabular a la derecha
function Row({
  label,
  value,
  bold = false,
  size = 11,
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
        fontWeight: bold ? 700 : 400,
        lineHeight: 1.5,
      }}
    >
      <span style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {value}
      </span>
    </div>
  )
}

function Separator() {
  return (
    <div
      style={{
        fontSize: "11px",
        textAlign: "center",
        margin: "8px 0",
        letterSpacing: "0.5px",
        userSelect: "none",
      }}
    >
      {SEPARATOR}
    </div>
  )
}

export const SaleReceipt = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  function SaleReceipt({ data }, ref) {
    const formattedDate = format(new Date(data.date), "dd/MM/yyyy", { locale: es })
    const formattedTime = format(new Date(data.date), "HH:mm", { locale: es })

    const withDiscount = data.items.filter((i) => i.discount > 0)
    const uniquePcts = new Set(
      withDiscount.map((i) => Number(i.discount_percent ?? 0))
    )
    const sameDiscountForAll =
      uniquePcts.size === 1 && [...uniquePcts][0] > 0

    return (
      <div
        ref={ref}
        style={{
          width: "80mm",
          margin: "0 auto",
          padding: "20px 14px",
          fontFamily: FONT_FAMILY,
          fontSize: "11px",
          color: "#000",
          lineHeight: 1.5,
          background: "#fff",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "4px",
              marginBottom: "6px",
            }}
          >
            {BUSINESS_NAME}
          </div>
          <div style={{ fontSize: "11px", fontWeight: 400 }}>
            {BUSINESS_LOCATION}
          </div>
          <div style={{ fontSize: "11px", fontWeight: 400 }}>
            Tel. {BUSINESS_PHONE}
          </div>
        </div>

        <Separator />

        {/* ── Sale info ── */}
        <Row
          label={<span>FOLIO</span>}
          value={<span style={{ fontWeight: 700 }}>{data.saleNumber}</span>}
          bold
        />
        <Row label="Fecha" value={`${formattedDate} ${formattedTime}`} />

        {data.customerName && (
          <div style={{ marginTop: "4px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700 }}>
              CLIENTE
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 400,
                wordBreak: "break-word",
              }}
            >
              {data.customerName}
            </div>
            {data.customerNumber && (
              <Row
                label="Nº Distribuidor"
                value={data.customerNumber}
                size={10}
              />
            )}
          </div>
        )}

        <Separator />

        {/* ── Items ── */}
        <div style={{ marginBottom: "4px" }}>
          <Row
            label={<span style={{ fontWeight: 700 }}>PRODUCTO</span>}
            value={<span style={{ fontWeight: 700 }}>IMPORTE</span>}
          />
        </div>

        {data.items.map((item, i) => {
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

          return (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  wordBreak: "break-word",
                }}
              >
                {item.product_name}
              </div>
              {item.variant_label !== item.product_name && (
                <div style={{ fontSize: "10px", fontWeight: 400 }}>
                  {item.variant_label}
                </div>
              )}
              <Row
                label={
                  <span style={{ fontSize: "10px", fontWeight: 400 }}>
                    {item.quantity} x {formatCurrency(item.unit_price)}
                    {pctLabel && (
                      <span style={{ fontWeight: 700 }}> -{pctLabel}</span>
                    )}
                    {isGift && (
                      <span style={{ fontWeight: 700 }}> REGALO</span>
                    )}
                  </span>
                }
                value={
                  <span style={{ fontWeight: 700 }}>
                    {isGift ? "GRATIS" : formatCurrency(item.line_total)}
                  </span>
                }
              />
            </div>
          )
        })}

        <Separator />

        {/* ── Totals ── */}
        <Row label="Subtotal" value={formatCurrency(data.subtotal)} />

        {data.discountAmount > 0 && (
          <>
            {sameDiscountForAll ? (
              (() => {
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
              })()
            ) : (
              <>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    marginTop: "4px",
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
                        <span style={{ fontSize: "10px" }}>
                          {item.product_name}
                          {pct > 0 && (
                            <span style={{ fontWeight: 700 }}> ({pct}%)</span>
                          )}
                          {isGift && (
                            <span style={{ fontWeight: 700 }}> REGALO</span>
                          )}
                        </span>
                      }
                      value={`-${formatCurrency(item.discount)}`}
                      size={10}
                    />
                  )
                })}
              </>
            )}
          </>
        )}

        <Separator />

        {/* ── Total ── */}
        <Row
          label={<span style={{ fontSize: "13px", fontWeight: 700 }}>TOTAL</span>}
          value={
            <span style={{ fontSize: "13px", fontWeight: 700 }}>
              {formatCurrency(data.total)}
            </span>
          }
        />

        <Separator />

        {/* ── Payments ── */}
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "2px" }}>
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
                  fontSize: "10px",
                  fontWeight: 400,
                  paddingLeft: "8px",
                  fontStyle: "italic",
                }}
              >
                Ref: {p.reference}
              </div>
            )}
          </div>
        ))}
        {data.change > 0 && (
          <Row
            label={<span style={{ fontWeight: 700 }}>Cambio</span>}
            value={<span style={{ fontWeight: 700 }}>{formatCurrency(data.change)}</span>}
          />
        )}

        <Separator />

        {/* ── Footer ── */}
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 400,
            marginTop: "10px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>
            GRACIAS POR TU COMPRA
          </div>
          <div style={{ fontSize: "10px" }}>Powered by Eclat POS</div>
          <div style={{ fontSize: "9px" }}>Desarrollado por Abbrix</div>
        </div>
      </div>
    )
  }
)
