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
