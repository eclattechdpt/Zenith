"use client"

import { useState } from "react"
import {
  Receipt,
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  Warehouse,
  Truck,
  Archive,
  CalendarDays,
  Download,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react"
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, isToday, isBefore, startOfDay, isSameWeek } from "date-fns"
import { es } from "date-fns/locale"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { logExport } from "../actions"

import { ExportCard, type ExportCardColor } from "./export-card"
import {
  exportSalesExcel,
  exportInventoryExcel,
  exportCustomersExcel,
  exportProductsExcel,
  exportTransitExcel,
  exportInitialLoadExcel,
} from "./excel-generators"

/* ── Color palettes per export card ── */

const COLORS = {
  rose: {
    cardBg: "bg-rose-50/40",
    cardBorder: "border-rose-200/50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(244,63,107,0.12)]",
    buttonClass: "bg-rose-500 text-white hover:bg-rose-600 border-0",
  },
  teal: {
    cardBg: "bg-teal-50/40",
    cardBorder: "border-teal-200/50",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(37,166,182,0.12)]",
    buttonClass: "bg-teal-500 text-white hover:bg-teal-600 border-0",
  },
  amber: {
    cardBg: "bg-amber-50/40",
    cardBorder: "border-amber-200/50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(245,158,11,0.12)]",
    buttonClass: "bg-amber-500 text-white hover:bg-amber-600 border-0",
  },
  violet: {
    cardBg: "bg-violet-50/40",
    cardBorder: "border-violet-200/50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(139,92,246,0.12)]",
    buttonClass: "bg-violet-500 text-white hover:bg-violet-600 border-0",
  },
  blush: {
    cardBg: "bg-pink-50/40",
    cardBorder: "border-pink-200/50",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(236,72,153,0.12)]",
    buttonClass: "bg-pink-500 text-white hover:bg-pink-600 border-0",
  },
  emerald: {
    cardBg: "bg-emerald-50/40",
    cardBorder: "border-emerald-200/50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(16,185,129,0.12)]",
    buttonClass: "bg-emerald-500 text-white hover:bg-emerald-600 border-0",
  },
} satisfies Record<string, ExportCardColor>

export function ExcelExports() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ExportCard
        title="Ventas"
        description="Historial completo de ventas con pagos y clientes"
        icon={Receipt}
        format="excel"
        color={COLORS.rose}
        delay={0.0}
        onExport={exportSalesExcel}
      />
      <ExportCard
        title="Inventario Fisico"
        description="Stock actual, minimo y estado por producto"
        icon={Package}
        format="excel"
        color={COLORS.teal}
        delay={0.04}
        onExport={exportInventoryExcel}
      />
      <ExportCard
        title="Inventario en Transito"
        description="Semanas de transito con productos y valores"
        icon={Truck}
        format="excel"
        color={COLORS.amber}
        delay={0.08}
        onExport={exportTransitExcel}
      />
      <ExportCard
        title="Inventario Carga Inicial"
        description="Stock inicial con precios y nombres editados"
        icon={Archive}
        format="excel"
        color={COLORS.violet}
        delay={0.12}
        onExport={exportInitialLoadExcel}
      />
      <ExportCard
        title="Clientes"
        description="Lista de clientes con datos de contacto"
        icon={Users}
        format="excel"
        color={COLORS.blush}
        delay={0.16}
        onExport={exportCustomersExcel}
      />
      <ExportCard
        title="Productos"
        description="Catalogo completo con variantes y precios"
        icon={ShoppingBag}
        format="excel"
        color={COLORS.emerald}
        delay={0.2}
        onExport={exportProductsExcel}
      />
    </div>
  )
}

/* ── Weekly Sales PDF — Dialog-based week picker ── */

type WeekPreset = "current" | "previous" | "custom"

function WeeklySalesDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [preset, setPreset] = useState<WeekPreset>("current")
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const queryClient = useQueryClient()

  const now = new Date()
  const selectedDate =
    preset === "current" ? now
    : preset === "previous" ? subWeeks(now, 1)
    : customDate ?? now

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const rangeLabel = `${format(weekStart, "d MMM", { locale: es })} — ${format(weekEnd, "d MMM yyyy", { locale: es })}`

  function handlePreset(p: WeekPreset) {
    setPreset(p)
    if (p !== "custom") {
      setCustomDate(undefined)
      setCalendarOpen(false)
    }
  }

  function handleCalendarSelect(day: Date | undefined) {
    if (!day) return
    setCustomDate(day)
    setPreset("custom")
    // Delay close slightly so user sees the selection highlight
    setTimeout(() => setCalendarOpen(false), 200)
  }

  async function handleExport() {
    if (isExporting) return
    setIsExporting(true)
    try {
      const { exportWeeklySalesPdf } = await import("./pdf-generators")
      await exportWeeklySalesPdf(selectedDate)
      await logExport("Reporte semanal", "pdf")
      queryClient.invalidateQueries({ queryKey: ["export-logs"] })
      toast.success("Reporte semanal exportado correctamente")
      onOpenChange(false)
    } catch {
      toast.error("Error al exportar reporte semanal")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100">
            <CalendarDays className="size-5 text-amber-600" strokeWidth={1.75} />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-neutral-900">
              Reporte semanal
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Selecciona el periodo a exportar
            </DialogDescription>
          </div>
        </div>

        {/* Segmented presets */}
        <div className="flex items-center gap-1.5 rounded-xl bg-amber-50/60 border border-amber-100 p-1">
          <button
            type="button"
            onClick={() => handlePreset("current")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              preset === "current"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-amber-50 hover:text-amber-700"
            )}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => handlePreset("previous")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              preset === "previous"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-amber-50 hover:text-amber-700"
            )}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => {
              if (preset === "custom" && calendarOpen) {
                setCalendarOpen(false)
              } else {
                setPreset("custom")
                setCalendarOpen(true)
              }
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              preset === "custom"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-amber-50 hover:text-amber-700"
            )}
          >
            <CalendarIcon className="size-3.5" />
            Elegir fecha
          </button>
        </div>

        {/* Inline calendar — slides in/out */}
        <AnimatePresence initial={false}>
          {calendarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-1 [&_.rdp-root]:w-full [&_.rdp-month]:w-full [&_.rdp-month_table]:w-full [&_[data-selected-single=true]]:!bg-amber-500 [&_[data-selected-single=true]]:!text-white [&_[data-today=true]]:bg-amber-100 [&_[data-today=true]]:text-amber-900">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={handleCalendarSelect}
                  disabled={{ after: new Date() }}
                  locale={es}
                  className="w-full"
                  modifiers={{
                    selectedWeek: (day) =>
                      customDate
                        ? isSameWeek(day, customDate, { weekStartsOn: 1 })
                        : false,
                  }}
                  modifiersClassNames={{
                    selectedWeek: "bg-amber-100 text-amber-900 rounded-none first:rounded-l-md last:rounded-r-md",
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline bar — hidden when calendar is open */}
        <AnimatePresence initial={false}>
        {!calendarOpen && (() => {
          const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
          const today = startOfDay(new Date())
          const DAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
          // For current/future weeks: fill up to today. For past weeks: fill all.
          const isPastWeek = isBefore(weekEnd, today)

          return (
            <motion.div
              key="timeline"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
            <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-4">
              {/* Month + year label */}
              <p className="text-center text-[11px] font-semibold text-neutral-500 mb-3 capitalize">
                {rangeLabel}
              </p>

              {/* Day labels */}
              <div className="flex items-center justify-between mb-2 px-1">
                {days.map((day, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-[10px] font-semibold w-8 text-center",
                      isToday(day) ? "text-amber-600" : "text-neutral-400"
                    )}
                  >
                    {DAY_LABELS[i]}
                  </span>
                ))}
              </div>

              {/* Timeline track */}
              <div className="relative flex items-center justify-between px-1">
                {/* Background line */}
                <div className="absolute left-5 right-5 top-1/2 -translate-y-1/2 h-1 rounded-full bg-neutral-200" />
                {/* Filled portion */}
                <div
                  className="absolute left-5 top-1/2 -translate-y-1/2 h-1 rounded-full bg-amber-400 transition-all duration-300"
                  style={{
                    width: isPastWeek
                      ? "calc(100% - 40px)"
                      : `calc(${
                          (days.filter((d) => isBefore(d, today) || isToday(d)).length / 7) * 100
                        }% - ${40 - (days.filter((d) => isBefore(d, today) || isToday(d)).length / 7) * 40}px)`,
                  }}
                />

                {/* Day dots */}
                {days.map((day, i) => {
                  const isPast = isBefore(day, today)
                  const isTodayDay = isToday(day)
                  const filled = isPastWeek || isPast || isTodayDay

                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center w-8">
                      <div
                        className={cn(
                          "rounded-full transition-all duration-200",
                          isTodayDay
                            ? "size-4 bg-amber-500 ring-4 ring-amber-100"
                            : filled
                              ? "size-3 bg-amber-400"
                              : "size-3 bg-neutral-200"
                        )}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Day numbers */}
              <div className="flex items-center justify-between mt-2 px-1">
                {days.map((day, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-[10px] font-bold w-8 text-center tabular-nums",
                      isToday(day) ? "text-amber-600" : "text-neutral-500"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                ))}
              </div>
            </div>
            </motion.div>
          )
        })()}
        </AnimatePresence>

        {/* Export button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-amber-500 text-white hover:bg-amber-600 border-0"
        >
          {isExporting ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 size-4" />
          )}
          {isExporting ? "Generando PDF..." : "Exportar PDF"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export function PdfExports() {
  const [weeklyOpen, setWeeklyOpen] = useState(false)

  async function handleSalesPdf() {
    const { exportSalesPdf } = await import("./pdf-generators")
    await exportSalesPdf()
  }

  async function handleInventoryPdf() {
    const { exportInventoryPdf } = await import("./pdf-generators")
    await exportInventoryPdf()
  }

  async function handleTransitPdf() {
    const { exportTransitPdf } = await import("./pdf-generators")
    await exportTransitPdf()
  }

  async function handleInitialLoadPdf() {
    const { exportInitialLoadPdf } = await import("./pdf-generators")
    await exportInitialLoadPdf()
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ExportCard
          title="Reporte de ventas"
          description="Resumen del mes con metricas y detalle de transacciones"
          icon={TrendingUp}
          format="pdf"
          color={COLORS.rose}
          delay={0.0}
          onExport={handleSalesPdf}
        />
        <ExportCard
          title="Reporte semanal"
          description="Ventas, metricas y top productos de la semana"
          icon={CalendarDays}
          format="pdf"
          color={COLORS.amber}
          delay={0.04}
          onExport={async () => { setWeeklyOpen(true) }}
          skipAutoLog
        />
        <ExportCard
          title="Inventario Fisico"
          description="Stock actual con alertas y valor total"
          icon={Warehouse}
          format="pdf"
          color={COLORS.teal}
          delay={0.08}
          onExport={handleInventoryPdf}
        />
        <ExportCard
          title="Inventario en Transito"
          description="Semanas de transito con productos y valores"
          icon={Truck}
          format="pdf"
          color={COLORS.amber}
          delay={0.12}
          onExport={handleTransitPdf}
        />
        <ExportCard
          title="Inventario Carga Inicial"
          description="Stock inicial con precios editados y valor total"
          icon={Archive}
          format="pdf"
          color={COLORS.violet}
          delay={0.16}
          onExport={handleInitialLoadPdf}
        />
      </div>

      <WeeklySalesDialog open={weeklyOpen} onOpenChange={setWeeklyOpen} />
    </>
  )
}
