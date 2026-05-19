"use client"

import { Gift, Percent, Tag } from "lucide-react"

import { cn, formatCurrency } from "@/lib/utils"
import type { DiscountLine } from "../store"
import type { DiscountSource } from "../types"

interface HistoricalItem {
  product_name: string
  discount: number | string
  discount_percent: number | string | null
}

/**
 * Construye un breakdown a partir de sale_items persistidos.
 * Heurística:
 * - Si todos los items con descuento tienen el mismo %, agrupa en 1 línea
 * - Si los % difieren, muestra una línea por item
 * - El cart-level custom_amount (sales.discount_amount cuando no viene en items)
 *   no se reconstruye aquí — solo descuentos por item.
 */
export function buildHistoricalBreakdown(items: HistoricalItem[]): DiscountLine[] {
  const withDiscount = items.filter((i) => Number(i.discount) > 0)
  if (withDiscount.length === 0) return []

  const uniquePcts = new Set(
    withDiscount.map((i) =>
      i.discount_percent != null ? Number(i.discount_percent) : 0
    )
  )

  // Todos los items tienen el mismo % → 1 línea agregada
  if (uniquePcts.size === 1) {
    const pct = [...uniquePcts][0]
    if (pct === 0) return []
    const totalAmount = withDiscount.reduce((s, i) => s + Number(i.discount), 0)
    return [{
      kind: "cart",
      label: "Descuento",
      amount: totalAmount,
      percent: pct,
      source: "list" satisfies DiscountSource,
    }]
  }

  // % distintos → 1 línea por item
  return withDiscount.map((i) => {
    const pct = i.discount_percent != null ? Number(i.discount_percent) : 0
    return {
      kind: "item" as const,
      label: i.product_name,
      amount: Number(i.discount),
      percent: pct,
      source: (pct === 100 ? "gift" : "list") satisfies DiscountSource,
      isGift: pct === 100,
    }
  })
}

interface DiscountBreakdownProps {
  lines: DiscountLine[]
  /** Variante de tamaño: compacta para sidebar, normal para footers grandes. */
  size?: "compact" | "normal"
  /** Botón ✕ para quitar el descuento del carrito (solo se muestra en líneas kind=cart). */
  onClearCartDiscount?: () => void
}

function formatPct(n: number): string {
  const rounded = Number(n.toFixed(2))
  return `${rounded}%`
}

export function DiscountBreakdown({
  lines,
  size = "normal",
  onClearCartDiscount,
}: DiscountBreakdownProps) {
  if (lines.length === 0) return null

  const textSize = size === "compact" ? "text-xs" : "text-sm"

  return (
    <>
      {lines.map((line, idx) => {
        const isCustomer = line.source === "customer"
        const isGift = line.isGift
        const color = isCustomer
          ? "text-teal-600"
          : isGift
            ? "text-violet-600"
            : "text-rose-500"
        const Icon = isCustomer ? Tag : isGift ? Gift : Percent

        return (
          <div
            key={`${line.kind}-${idx}`}
            className={cn("flex justify-between items-center", textSize)}
          >
            <span className={cn("flex items-center gap-1 font-medium", color)}>
              <Icon className="size-3 flex-shrink-0" />
              <span className="truncate">{line.label}</span>
              {line.percent != null && line.percent > 0 && (
                <span className="tabular-nums whitespace-nowrap">
                  ({formatPct(line.percent)})
                </span>
              )}
              {isGift && (
                <span className="rounded bg-violet-100 px-1.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
                  Regalo
                </span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={cn("font-medium tabular-nums", color)}>
                -{formatCurrency(line.amount)}
              </span>
              {line.kind === "cart" && onClearCartDiscount && (
                <button
                  type="button"
                  onClick={onClearCartDiscount}
                  aria-label="Quitar descuento del carrito"
                  className="flex size-4 items-center justify-center rounded text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <span className="text-[10px]">✕</span>
                </button>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
