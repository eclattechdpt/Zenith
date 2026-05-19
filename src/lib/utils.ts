import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Currency ──

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

// ── Search ──

export function normalizeSearch(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

// ── Dates ──

export function formatDate(date: Date | string): string {
  return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es })
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "h:mm a", { locale: es })
}

// ── Variants ──

/**
 * Ordena variantes por SKU usando comparación natural (numérica).
 * "E-99" < "E-100", "E-2106" < "E-2111", etc. Variantes sin SKU al final.
 */
export function sortVariantsBySku<T extends { sku?: string | null }>(
  variants: T[]
): T[] {
  return [...variants].sort((a, b) =>
    (a.sku ?? "").localeCompare(b.sku ?? "", undefined, {
      numeric: true,
      sensitivity: "base",
    })
  )
}

// ── Discount percent ──

// Returns "30%" / "30.5%" / "30.45%" — trims trailing zeros after the decimal point.
// Prefers `exactPercent` (known % from preset or custom-% input) over computation.
// Falls back to `(amount / subtotal) * 100` with 2-decimal precision.
export function formatDiscountPercent(
  amount: number,
  subtotal: number,
  exactPercent?: number | null
): string {
  let value: number
  if (exactPercent != null && exactPercent > 0) {
    value = exactPercent
  } else if (subtotal > 0 && amount > 0) {
    value = (amount / subtotal) * 100
  } else {
    return ""
  }
  const rounded = Number(value.toFixed(2))
  return `${rounded}%`
}
