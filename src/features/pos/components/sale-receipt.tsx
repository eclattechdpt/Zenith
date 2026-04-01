import { forwardRef } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/constants"

interface ReceiptItem {
  product_name: string
  variant_label: string
  quantity: number
  unit_price: number
  discount: number
  line_total: number
}

interface ReceiptPayment {
  method: string
  amount: number
}

export interface ReceiptData {
  saleNumber: string
  date: string
  customerName: string | null
  items: ReceiptItem[]
  payments: ReceiptPayment[]
  subtotal: number
  discountAmount: number
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
          padding: "24px 20px",
          fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', sans-serif",
          fontSize: "11px",
          color: "#1a1a1a",
          lineHeight: 1.5,
          background: "#ffffff",
        }}
      >
        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ZenitLogo_DarkWithPink.svg"
            alt="Zenith"
            style={{ height: "28px", margin: "0 auto 8px" }}
          />
          <div
            style={{
              fontSize: "9px",
              color: "#888",
              letterSpacing: "0.5px",
            }}
          >
            {BUSINESS_NAME} &middot; {BUSINESS_LOCATION}
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "#888",
              marginTop: "2px",
            }}
          >
            Tel. {BUSINESS_PHONE}
          </div>
        </div>

        {/* ── Accent line ── */}
        <div
          style={{
            height: "2px",
            background: "linear-gradient(90deg, #FF6B8A, #F43F6B, #FF6B8A)",
            borderRadius: "1px",
            marginBottom: "16px",
          }}
        />

        {/* ── Sale info ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
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
                fontSize: "16px",
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

        {/* ── Customer ── */}
        {data.customerName && (
          <div
            style={{
              background: "#f8f8f8",
              borderRadius: "6px",
              padding: "8px 10px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "9px", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Cliente
            </span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#1a1a1a" }}>
              {data.customerName}
            </span>
          </div>
        )}

        {/* ── Items ── */}
        <div style={{ marginBottom: "16px" }}>
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
                borderBottom: i < data.items.length - 1 ? "1px solid #f0f0f0" : "none",
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
                  <div style={{ fontSize: "10px", color: "#888", marginTop: "1px" }}>
                    {item.quantity} x {formatCurrency(item.unit_price)}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#1a1a1a",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCurrency(item.line_total)}
                </div>
              </div>
              {item.discount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    color: "#F43F6B",
                    marginTop: "2px",
                  }}
                >
                  <span>Descuento</span>
                  <span>-{formatCurrency(item.discount)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            height: "1px",
            background: "#e5e5e5",
            marginBottom: "12px",
          }}
        />

        {/* ── Totals ── */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#666",
              marginBottom: "4px",
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
                marginBottom: "4px",
              }}
            >
              <span>Descuento</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                -{formatCurrency(data.discountAmount)}
              </span>
            </div>
          )}

          {/* Total highlight */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, #FFF0F3, #FFE0E8)",
              borderRadius: "8px",
              padding: "10px 12px",
              marginTop: "8px",
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
        </div>

        {/* ── Payments ── */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: "6px",
            padding: "10px 12px",
            marginBottom: "20px",
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
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#444",
                marginBottom: i < data.payments.length - 1 ? "3px" : 0,
              }}
            >
              <span>
                {PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ??
                  p.method}
              </span>
              <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(p.amount)}
              </span>
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

        {/* ── Footer ── */}
        <div
          style={{
            textAlign: "center",
            paddingTop: "12px",
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
              marginTop: "4px",
            }}
          >
            Powered by Zenith POS
          </div>
        </div>
      </div>
    )
  }
)
