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

const BUSINESS_NAME = "Eclat"
const BUSINESS_PHONE = "33 1234 5678"
const BUSINESS_LOCATION = "Zapopan, Jalisco"

export const SaleReceipt = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  function SaleReceipt({ data }, ref) {
    const formattedDate = format(new Date(data.date), "dd 'de' MMMM, yyyy", {
      locale: es,
    })
    const formattedTime = format(new Date(data.date), "HH:mm", { locale: es })

    return (
      <div
        ref={ref}
        style={{
          width: "80mm",
          margin: "0 auto",
          padding: "28px 20px",
          fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', sans-serif",
          fontSize: "11px",
          color: "#1a1a1a",
          lineHeight: 1.5,
          background: "#ffffff",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* ── Section 1: Branding ── */}
        <div style={{ marginBottom: "24px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/EclatLogo_DarkWithPink.svg"
            alt="Eclat"
            style={{ height: "26px", display: "block", marginBottom: "8px" }}
          />
          <div
            style={{
              fontSize: "9px",
              color: "#888",
              letterSpacing: "0.3px",
              lineHeight: 1.6,
            }}
          >
            {BUSINESS_NAME} &middot; {BUSINESS_LOCATION}
            <br />
            Tel. {BUSINESS_PHONE}
          </div>
        </div>

        {/* ── Accent line ── */}
        <div
          style={{
            height: "2px",
            background: "linear-gradient(90deg, #FF6B8A, #F43F6B, #FF6B8A)",
            borderRadius: "1px",
            marginBottom: "24px",
          }}
        />

        {/* ── Section 2: Info (Folio + Fecha + Cliente) ── */}
        <div
          style={{
            background: "#f2f0ee",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: data.customerName ? "10px" : 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "9px",
                  color: "#999",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "2px",
                }}
              >
                Folio
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  letterSpacing: "-0.5px",
                }}
              >
                {data.saleNumber}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "#666" }}>
                {formattedDate}
              </div>
              <div style={{ fontSize: "10px", color: "#999" }}>
                {formattedTime} hrs
              </div>
            </div>
          </div>

          {data.customerName && (
            <div
              style={{
                paddingTop: "10px",
                borderTop: "1px solid #eeeeee",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    color: "#999",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Cliente
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    textAlign: "right",
                  }}
                >
                  {data.customerName}
                </span>
              </div>
              {data.customerNumber && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "3px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#999",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Nº Distribuidor
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#444",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {data.customerNumber}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Section 3: Resumen (Items) ── */}
        <div style={{ marginBottom: "24px" }}>
          {/* Table header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 0 6px",
              borderBottom: "1px solid #e5e5e5",
              marginBottom: "8px",
              fontSize: "9px",
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <span>Producto</span>
            <span>Importe</span>
          </div>

          {data.items.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "6px 0",
                borderBottom:
                  i < data.items.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: "11px",
                      color: "#1a1a1a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.product_name}
                  </div>
                  {item.variant_label !== item.product_name && (
                    <div style={{ fontSize: "9px", color: "#999" }}>
                      {item.variant_label}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#888",
                      marginTop: "1px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {item.discount > 0 ? (
                      <>
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#bbb",
                          }}
                        >
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </span>
                        {item.discount_percent != null && item.discount_percent > 0 && (
                          <span
                            style={{
                              color: "#F43F6B",
                              fontWeight: 600,
                            }}
                          >
                            -{formatDiscountPercent(item.discount, item.unit_price * item.quantity, item.discount_percent)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>
                        {item.quantity} x {formatCurrency(item.unit_price)}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "11px",
                    color: item.line_total === 0 ? "#8b5cf6" : "#1a1a1a",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {item.line_total === 0 && item.discount > 0
                    ? "GRATIS"
                    : formatCurrency(item.line_total)}
                </div>
              </div>
            </div>
          ))}

          {/* Subtotal */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#666",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #e5e5e5",
            }}
          >
            <span>Subtotal</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCurrency(data.subtotal)}
            </span>
          </div>
          {data.discountAmount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#F43F6B",
                marginTop: "4px",
              }}
            >
              <span>
                Descuento
                {(() => {
                  // Si los items tienen distintos %, NO mostrar % del cart-level
                  // (engañoso). Solo mostrarlo si todos los items siguen el mismo %.
                  const uniquePcts = new Set(
                    data.items
                      .filter((i) => i.discount > 0)
                      .map((i) => Number(i.discount_percent ?? 0))
                  )
                  const sameForAll = uniquePcts.size === 1 && [...uniquePcts][0] > 0
                  if (!sameForAll) return null
                  const pct = formatDiscountPercent(data.discountAmount, data.subtotal, [...uniquePcts][0])
                  return pct ? (
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                      {" "}({pct})
                    </span>
                  ) : null
                })()}
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                -{formatCurrency(data.discountAmount)}
              </span>
            </div>
          )}
        </div>

        {/* ── Section 4: Pago (Total + Payment) ── */}
        <div style={{ marginBottom: "24px" }}>
          {/* Total highlight */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, #FFF0F3, #FFE0E8)",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#1a1a1a",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Total
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#1a1a1a",
                letterSpacing: "-0.5px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrency(data.total)}
            </span>
          </div>

          {/* Payment method */}
          <div
            style={{
              background: "#f2f0ee",
              borderRadius: "6px",
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "6px",
              }}
            >
              Forma de pago
            </div>
            {data.payments.map((p, i) => (
              <div
                key={i}
                style={{
                  marginBottom: i < data.payments.length - 1 ? "3px" : 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#444",
                  }}
                >
                  <span>
                    {PAYMENT_METHODS[
                      p.method as keyof typeof PAYMENT_METHODS
                    ] ?? p.method}
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCurrency(p.amount)}
                  </span>
                </div>
                {p.reference && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#888",
                      fontStyle: "italic",
                      marginTop: "1px",
                      paddingLeft: "8px",
                    }}
                  >
                    {p.reference}
                  </div>
                )}
              </div>
            ))}
            {data.change > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#22859A",
                  marginTop: "6px",
                  paddingTop: "6px",
                  borderTop: "1px solid #e5e5e5",
                }}
              >
                <span>Cambio</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(data.change)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 5: Technical Credits ── */}
        <div
          style={{
            textAlign: "center",
            paddingTop: "16px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#666",
              fontWeight: 500,
            }}
          >
            Gracias por tu compra
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "#bbb",
              marginTop: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            Powered by
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/EclatLogo_DarkWithPink.svg"
              alt="Eclat POS"
              style={{ height: "12px", opacity: 0.5 }}
            />
          </div>
          <div
            style={{
              fontSize: "8px",
              color: "#ccc",
              marginTop: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
            }}
          >
            Desarrollado por
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/abbrixLogo.svg"
              alt="Abbrix"
              style={{ height: "8px", opacity: 0.4 }}
            />
          </div>
        </div>
      </div>
    )
  }
)
