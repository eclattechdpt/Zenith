import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns"
import { es } from "date-fns/locale"

export type DateFilterPreset = "today" | "week" | "month" | "custom"

export interface DateFilterState {
  preset: DateFilterPreset
  selectedMonth: Date
  customDate: string
}

export function getDateRange(
  state: DateFilterState
): { from: string; to: string } | null {
  const { preset, selectedMonth, customDate } = state
  const now = new Date()
  const todayEnd = endOfDay(now).toISOString()
  if (preset === "today") {
    return { from: startOfDay(now).toISOString(), to: todayEnd }
  }
  if (preset === "week") {
    return {
      from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
      to: todayEnd,
    }
  }
  if (preset === "month") {
    return {
      from: startOfMonth(selectedMonth).toISOString(),
      to: endOfMonth(selectedMonth).toISOString(),
    }
  }
  if (preset === "custom" && customDate) {
    // "yyyy-MM-dd" parseado con `new Date(...)` se interpreta como UTC
    // midnight; en TZs negativos (México UTC-6) eso devuelve el día previo
    // local. Anclamos al mediodía local para que startOfDay/endOfDay
    // siempre caigan dentro del día correcto.
    const date = new Date(customDate + "T12:00:00")
    return {
      from: startOfDay(date).toISOString(),
      to: endOfDay(date).toISOString(),
    }
  }
  return null
}

// Frase corta para inyectar en subtítulos de KPI: "hoy", "esta semana", etc.
export function getRangeLabel(state: DateFilterState): string {
  const { preset, selectedMonth, customDate } = state
  if (preset === "today") return "hoy"
  if (preset === "week") return "esta semana"
  if (preset === "month") {
    return format(selectedMonth, "MMMM yyyy", { locale: es })
  }
  if (preset === "custom" && customDate) {
    return format(new Date(customDate + "T12:00:00"), "d MMM yyyy", { locale: es })
  }
  return ""
}
